from django.shortcuts import render
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from django.urls import reverse_lazy
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.db.models import Sum

from .models import (
    User, Customer, LoyaltyProgram, LoyaltyTransaction, BillingTransaction,
    Campaign, CampaignInteraction, SupportTicket, TicketComment,
    CustomerInteraction
)

from .serializers import (
    MyTOPS, RegistrationSerializer, UserSerializer, ProfileSerializer,
    CustomerSerializer, CustomerDetailSerializer, BillingTransactionSerializer,
    LoyaltyProgramSerializer, LoyaltyTransactionSerializer,
    CampaignSerializer, CampaignInteractionSerializer,
    SupportTicketSerializer, SupportTicketDetailSerializer, TicketCommentSerializer,
    CustomerInteractionSerializer
)

# ==================== HELPER FUNCTIONS ====================
def update_loyalty_tier(customer):
    """Update the loyalty program tier based on the customer's total billing.

    Here we assume ``customer.billing_amount`` already represents the
    consolidated total of all billings (initial + all BillingTransaction
    records). This keeps a single source of truth for totals.
    """
    try:
        loyalty_program = customer.loyalty_program
    except LoyaltyProgram.DoesNotExist:
        return
    
    total_billing = float(customer.billing_amount or 0)
    
    # Determine tier based on billing amount
    if total_billing >= 50000:
        new_tier = 'platinum'
    elif total_billing >= 20000:
        new_tier = 'gold'
    elif total_billing >= 5000:
        new_tier = 'silver'
    else:
        new_tier = 'bronze'
    
    # Update points (15% of total billing)
    new_points = int(total_billing * 0.15)
    
    # Only update if tier or points changed
    if loyalty_program.tier != new_tier or loyalty_program.total_points != new_points:
        loyalty_program.tier = new_tier
        loyalty_program.total_points = new_points
        loyalty_program.points_balance = new_points
        loyalty_program.save()


# ==================== CUSTOMER VIEWS ====================


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTOPS


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegistrationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protectedView(request):
    output = f"Welcome {request.user}, Authentication SUccessful"
    return Response({"response": output}, status=status.HTTP_200_OK)


@api_view(["GET"])
def view_all_routes(request):
    data = [
        "api/token/refresh/",
        "api/register/",
        "api/token/",
        "api/customers/",
        "api/loyalty-programs/",
        "api/campaigns/",
        "api/support-tickets/",
        "api/interactions/",
    ]
    return Response(data)


# ==================== CUSTOMER VIEWS ====================
class CustomerListCreateAPIView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return all customers
        return Customer.objects.all()
    
    def perform_create(self, serializer):
        # Automatically assign the customer to the current user
        serializer.save(assigned_to=self.request.user)


class CustomerRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_update(self, serializer):
        customer = serializer.save()
        # Update loyalty program tier when customer billing is updated
        try:
            update_loyalty_tier(customer)
        except Exception as e:
            print(f"Error updating loyalty tier: {e}")
            # Don't fail the request if tier update fails


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        # Return all customers - no filtering by assigned_to
        return Customer.objects.all()
    
    def perform_create(self, serializer):
        # Automatically assign the customer to the current user
        serializer.save(assigned_to=self.request.user)


# ==================== BILLING TRANSACTION VIEWS ====================
class BillingTransactionListCreateAPIView(generics.ListCreateAPIView):
    queryset = BillingTransaction.objects.all()
    serializer_class = BillingTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            return BillingTransaction.objects.filter(customer_id=customer_id)
        return BillingTransaction.objects.all()
    
    def perform_create(self, serializer):
        billing_transaction = serializer.save()
        customer = billing_transaction.customer

        # Increase customer's consolidated billing_amount by this transaction
        try:
            current_total = float(customer.billing_amount or 0)
            customer.billing_amount = current_total + float(billing_transaction.amount or 0)
            customer.save(update_fields=["billing_amount"])

            # Update loyalty program tier using the new total
            update_loyalty_tier(customer)
        except Exception as e:
            print(f"Error updating billing total / loyalty tier: {e}")
            # Don't fail the request if tier update fails


class BillingTransactionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BillingTransaction.objects.all()
    serializer_class = BillingTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_update(self, serializer):
        # Get previous amount to adjust customer's total correctly
        old_instance = self.get_object()
        old_amount = float(old_instance.amount or 0)

        billing_transaction = serializer.save()
        customer = billing_transaction.customer

        try:
            current_total = float(customer.billing_amount or 0)
            new_amount = float(billing_transaction.amount or 0)
            customer.billing_amount = current_total - old_amount + new_amount
            customer.save(update_fields=["billing_amount"])

            # Update loyalty program tier using the new total
            update_loyalty_tier(customer)
        except Exception as e:
            print(f"Error updating billing total / loyalty tier: {e}")
            # Don't fail the request if tier update fails
    
    def perform_destroy(self, instance):
        customer = instance.customer
        amount = float(instance.amount or 0)
        instance.delete()

        try:
            current_total = float(customer.billing_amount or 0)
            customer.billing_amount = max(0.0, current_total - amount)
            customer.save(update_fields=["billing_amount"])

            # Update loyalty program tier using the new total
            update_loyalty_tier(customer)
        except Exception as e:
            print(f"Error updating billing total / loyalty tier: {e}")
            # Don't fail the request if tier update fails


# ==================== LOYALTY PROGRAM VIEWS ====================
class LoyaltyProgramListAPIView(generics.ListCreateAPIView):
    queryset = LoyaltyProgram.objects.all()
    serializer_class = LoyaltyProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # When creating a loyalty program, it must be linked to a customer
        serializer.save()


class LoyaltyProgramRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = LoyaltyProgram.objects.all()
    serializer_class = LoyaltyProgramSerializer
    permission_classes = [IsAuthenticated]


class LoyaltyTransactionListCreateAPIView(generics.ListCreateAPIView):
    queryset = LoyaltyTransaction.objects.all()
    serializer_class = LoyaltyTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        loyalty_program_id = self.request.query_params.get('loyalty_program')
        if loyalty_program_id:
            return LoyaltyTransaction.objects.filter(loyalty_program_id=loyalty_program_id)
        return LoyaltyTransaction.objects.all()


# ==================== CAMPAIGN VIEWS ====================
class CampaignListCreateAPIView(generics.ListCreateAPIView):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CampaignRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]


class CampaignInteractionListCreateAPIView(generics.ListCreateAPIView):
    queryset = CampaignInteraction.objects.all()
    serializer_class = CampaignInteractionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        campaign_id = self.request.query_params.get('campaign')
        if campaign_id:
            return CampaignInteraction.objects.filter(campaign_id=campaign_id)
        return CampaignInteraction.objects.all()


# ==================== SUPPORT TICKET VIEWS ====================
class SupportTicketListCreateAPIView(generics.ListCreateAPIView):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return all tickets for now (can be filtered by assigned_to if needed)
        return SupportTicket.objects.all()
    
    def perform_create(self, serializer):
        # Auto-assign to current user if not already assigned
        if serializer.validated_data.get('assigned_to') is None:
            serializer.save(assigned_to=self.request.user)
        else:
            serializer.save()


class SupportTicketRetrieveUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketDetailSerializer
    permission_classes = [IsAuthenticated]


class TicketCommentListCreateAPIView(generics.ListCreateAPIView):
    queryset = TicketComment.objects.all()
    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            return TicketComment.objects.filter(ticket_id=ticket_id)
        return TicketComment.objects.all()
    
    def perform_create(self, serializer):
        # Check if ticket is resolved or closed
        ticket_id = self.request.data.get('ticket')
        if ticket_id:
            ticket = SupportTicket.objects.get(id=ticket_id)
            if ticket.status in ['resolved', 'closed']:
                raise serializers.ValidationError(
                    f"Cannot add comments to a {ticket.status} ticket. "
                    "The ticket is no longer open for updates."
                )
        serializer.save(author=self.request.user)


# ==================== CUSTOMER INTERACTION VIEWS ====================
class CustomerInteractionListCreateAPIView(generics.ListCreateAPIView):
    queryset = CustomerInteraction.objects.all()
    serializer_class = CustomerInteractionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            return CustomerInteraction.objects.filter(customer_id=customer_id)
        return CustomerInteraction.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)