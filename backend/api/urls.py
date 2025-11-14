from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path("token/", views.MyTokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh-token"),
    path("register/", views.RegisterView.as_view(), name="register-user"),
    path("test/", views.protectedView, name="test"),
    path("", views.view_all_routes, name="all-routes"),
    
    # Customer endpoints
    path("customers/", views.CustomerListCreateAPIView.as_view(), name="customer-list-create"),
    path("customers/<int:pk>/", views.CustomerRetrieveUpdateDestroyAPIView.as_view(), name="customer-detail"),
    
    # Billing Transaction endpoints
    path("billing-transactions/", views.BillingTransactionListCreateAPIView.as_view(), name="billing-transaction-list-create"),
    path("billing-transactions/<int:pk>/", views.BillingTransactionRetrieveUpdateDestroyAPIView.as_view(), name="billing-transaction-detail"),
    
    # Loyalty Program endpoints
    path("loyalty-programs/", views.LoyaltyProgramListAPIView.as_view(), name="loyalty-program-list"),
    path("loyalty-programs/<int:pk>/", views.LoyaltyProgramRetrieveUpdateAPIView.as_view(), name="loyalty-program-detail"),
    path("loyalty-transactions/", views.LoyaltyTransactionListCreateAPIView.as_view(), name="loyalty-transaction-list-create"),
    
    # Campaign endpoints
    path("campaigns/", views.CampaignListCreateAPIView.as_view(), name="campaign-list-create"),
    path("campaigns/<int:pk>/", views.CampaignRetrieveUpdateDestroyAPIView.as_view(), name="campaign-detail"),
    path("campaign-interactions/", views.CampaignInteractionListCreateAPIView.as_view(), name="campaign-interaction-list-create"),
    
    # Support Ticket endpoints
    path("support-tickets/", views.SupportTicketListCreateAPIView.as_view(), name="support-ticket-list-create"),
    path("support-tickets/<int:pk>/", views.SupportTicketRetrieveUpdateAPIView.as_view(), name="support-ticket-detail"),
    path("ticket-comments/", views.TicketCommentListCreateAPIView.as_view(), name="ticket-comment-list-create"),
    
    # Customer Interaction endpoints
    path("interactions/", views.CustomerInteractionListCreateAPIView.as_view(), name="interaction-list-create"),
]
