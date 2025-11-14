from rest_framework_simplejwt.tokens import Token
from .models import (
    User, Customer, LoyaltyProgram, LoyaltyTransaction, BillingTransaction,
    Campaign, CampaignInteraction, SupportTicket, TicketComment,
    CustomerInteraction, Profile
)
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["full_name", "bio", "verified"]


class MyTOPS(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["full_name"] = user.profile.full_name
        token["username"] = user.username
        token["email"] = user.email
        token["bio"] = user.profile.bio

        return token


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["full_name", "email", "username", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password Fields Didn't Match"}
            )
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"], email=validated_data["email"]
        )
        user.set_password(validated_data["password"])
        user.save()

        # Ensure profile exists (signal should create it, but handle if it doesn't)
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=user)
        
        if "full_name" in validated_data:
            profile.full_name = validated_data["full_name"]
            profile.save()

        return user


# ==================== CUSTOMER SERIALIZERS ====================
class BillingTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingTransaction
        fields = '__all__'
        read_only_fields = ['created_at', 'transaction_date']


class CustomerSerializer(serializers.ModelSerializer):
    billing_transactions = BillingTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'assigned_to']


class CustomerDetailSerializer(serializers.ModelSerializer):
    loyalty_program = serializers.SerializerMethodField()
    billing_transactions = serializers.SerializerMethodField()
    support_tickets = serializers.SerializerMethodField()
    total_campaigns = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_billing_transactions(self, obj):
        try:
            transactions = obj.billing_transactions.all()
            return BillingTransactionSerializer(transactions, many=True).data
        except:
            return []
    
    def get_loyalty_program(self, obj):
        try:
            return LoyaltyProgramSerializer(obj.loyalty_program).data
        except LoyaltyProgram.DoesNotExist:
            return None
    
    def get_support_tickets(self, obj):
        try:
            tickets = obj.support_tickets.all()[:5]  # Last 5 tickets
            return SupportTicketSerializer(tickets, many=True).data
        except:
            return []
    
    def get_total_campaigns(self, obj):
        try:
            return obj.campaigns.count()
        except:
            return 0


# ==================== LOYALTY PROGRAM SERIALIZERS ====================
class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTransaction
        fields = '__all__'
        read_only_fields = ['transaction_date']


class LoyaltyProgramSerializer(serializers.ModelSerializer):
    transactions = LoyaltyTransactionSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LoyaltyProgram
        fields = '__all__'
        read_only_fields = ['enrollment_date']
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"
    
    def validate_customer(self, value):
        # Check if a loyalty program already exists for this customer
        if self.instance is None:  # Only check on creation, not update
            if LoyaltyProgram.objects.filter(customer=value).exists():
                raise serializers.ValidationError("This customer already has a loyalty program.")
        return value


# ==================== CAMPAIGN SERIALIZERS ====================
class CampaignInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignInteraction
        fields = '__all__'
        read_only_fields = ['interaction_date']


class CampaignSerializer(serializers.ModelSerializer):
    interactions = CampaignInteractionSerializer(many=True, read_only=True)
    open_rate = serializers.ReadOnlyField()
    click_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['created_at', 'sent_count', 'opened_count', 'clicked_count', 'conversion_count']


# ==================== SUPPORT TICKET SERIALIZERS ====================
class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = TicketComment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    comments = TicketCommentSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    customer_name = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'ticket_id']


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    comments = TicketCommentSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    customer_details = CustomerSerializer(source='customer', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'ticket_id']
    
    def validate(self, data):
        """Prevent updates to resolved or closed tickets"""
        if self.instance:
            # If ticket is already resolved or closed, prevent status change to anything else
            if self.instance.status in ['resolved', 'closed']:
                # Allow update only if status is being changed to 'closed' from 'resolved'
                if 'status' in data:
                    new_status = data['status']
                    if self.instance.status == 'resolved' and new_status == 'closed':
                        # Allow transitioning from resolved to closed
                        return data
                    elif self.instance.status == 'closed':
                        # Closed tickets cannot change status at all
                        raise serializers.ValidationError(
                            "Closed tickets cannot be modified. The ticket is archived."
                        )
                    else:
                        raise serializers.ValidationError(
                            f"Cannot change status from '{self.instance.status}' to '{new_status}'. "
                            "Tickets in '{self.instance.status}' state can only transition to 'closed'."
                        )
        return data


# ==================== CUSTOMER INTERACTION SERIALIZERS ====================
class CustomerInteractionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    customer_name = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = CustomerInteraction
        fields = '__all__'
        read_only_fields = ['created_at']