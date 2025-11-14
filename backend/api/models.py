from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.utils import timezone

# Create your models here.


class User(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def profile(self):
        profile = Profile.objects.get(user=self)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)
    bio = models.CharField(max_length=1000)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name


# ==================== CUSTOMER MODEL ====================
class Customer(models.Model):
    """
    Main Customer model that serves as the hub for all CRM operations.
    Can be used for both B2B and B2C customers.
    """
    COMPANY_CHOICES = [
        ('Reliance Digital', 'Reliance Digital'),
        ('Titan', 'Titan'),
        ('Peter England', 'Peter England'),
        ('Bata', 'Bata'),
    ]
    
    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    
    # Company Information
    company_name = models.CharField(max_length=200, choices=COMPANY_CHOICES, blank=True, null=True)
    
    # Address
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zipcode = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Customer Details
    source = models.CharField(max_length=100, blank=True, null=True)  # How customer found you
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    
    # Transaction Details
    date_of_purchase = models.DateField(auto_now_add=True)
    billing_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Metrics
    lifetime_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_purchases = models.IntegerField(default=0)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_contact = models.DateTimeField(blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Customers"
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}"


# ==================== BILLING TRANSACTION MODEL ====================
class BillingTransaction(models.Model):
    """
    Track individual billing transactions for customers.
    Allows customers to have multiple billing amounts over time.
    """
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='billing_transactions')
    
    # Transaction Details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date']
        verbose_name_plural = "Billing Transactions"
    
    def __str__(self):
        return f"{self.customer.email} - ₹{self.amount} - {self.transaction_date.strftime('%Y-%m-%d')}"


# ==================== LOYALTY PROGRAM MODEL ====================
class LoyaltyProgram(models.Model):
    """
    Loyalty program that tracks customer rewards and points.
    """
    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='loyalty_program')
    
    # Points System
    total_points = models.IntegerField(default=0)
    points_balance = models.IntegerField(default=0)
    
    # Tier System
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='bronze')
    tier_progress = models.IntegerField(default=0)  # Progress to next tier (percentage)
    
    # Rewards
    lifetime_rewards_earned = models.IntegerField(default=0)
    lifetime_rewards_redeemed = models.IntegerField(default=0)
    
    # Dates
    enrollment_date = models.DateTimeField(auto_now_add=True)
    last_points_earned = models.DateTimeField(blank=True, null=True)
    last_points_redeemed = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Loyalty Programs"
    
    def __str__(self):
        return f"Loyalty - {self.customer.email} ({self.tier.upper()})"


class LoyaltyTransaction(models.Model):
    """
    Individual loyalty transactions (earning/redeeming points).
    """
    TRANSACTION_TYPE_CHOICES = [
        ('earned', 'Points Earned'),
        ('redeemed', 'Points Redeemed'),
        ('expired', 'Points Expired'),
        ('adjusted', 'Points Adjusted'),
    ]
    
    loyalty_program = models.ForeignKey(LoyaltyProgram, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    points = models.IntegerField()
    
    description = models.CharField(max_length=200)
    reference_id = models.CharField(max_length=100, blank=True, null=True)  # Order ID, Redemption ID, etc.
    
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.loyalty_program.customer.email} - {self.transaction_type} - {self.points} pts"


# ==================== CAMPAIGN MODEL ====================
class Campaign(models.Model):
    """
    Marketing campaign that can be targeted at customers.
    """
    CAMPAIGN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('social', 'Social Media'),
        ('discount', 'Discount Offer'),
        ('event', 'Event'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]
    
    # Campaign Details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Target Audience
    customers = models.ManyToManyField(Customer, related_name='campaigns', blank=True)
    target_tier = models.CharField(
        max_length=20,
        choices=LoyaltyProgram.TIER_CHOICES,
        blank=True,
        null=True
    )  # Optional: target specific tier
    target_company = models.CharField(
        max_length=200,
        choices=Customer.COMPANY_CHOICES,
        blank=True,
        null=True
    )  # Optional: target specific company
    
    # Content
    subject_line = models.CharField(max_length=200)
    content = models.TextField()
    call_to_action = models.CharField(max_length=200, blank=True, null=True)
    
    # Incentive (optional)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_percentage = models.IntegerField(blank=True, null=True)
    loyalty_points_reward = models.IntegerField(default=0)
    
    # Schedule
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateTimeField(blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    
    # Analytics
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    conversion_count = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='campaigns_created')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.campaign_type})"
    
    @property
    def open_rate(self):
        if self.sent_count == 0:
            return 0
        return (self.opened_count / self.sent_count) * 100
    
    @property
    def click_rate(self):
        if self.opened_count == 0:
            return 0
        return (self.clicked_count / self.opened_count) * 100


class CampaignInteraction(models.Model):
    """
    Track individual customer interactions with campaigns.
    """
    INTERACTION_TYPE_CHOICES = [
        ('sent', 'Sent'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
        ('converted', 'Converted'),
        ('bounced', 'Bounced'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='interactions')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='campaign_interactions')
    
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES)
    interaction_date = models.DateTimeField(auto_now_add=True)
    
    details = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-interaction_date']
    
    def __str__(self):
        return f"{self.campaign.name} - {self.customer.email} - {self.interaction_type}"


# ==================== SUPPORT TICKET MODEL ====================
class SupportTicket(models.Model):
    """
    Customer support tickets for issue tracking and resolution.
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting', 'Waiting for Customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    CATEGORY_CHOICES = [
        ('billing', 'Billing'),
        ('technical', 'Technical'),
        ('general', 'General Inquiry'),
        ('complaint', 'Complaint'),
        ('feature_request', 'Feature Request'),
        ('feedback', 'Feedback'),
    ]
    
    # Ticket Info
    ticket_id = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='support_tickets')
    
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # Resolution
    resolution_notes = models.TextField(blank=True, null=True)
    customer_satisfaction = models.IntegerField(blank=True, null=True)  # Rating 1-5
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket_id} - {self.customer.email}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_id:
            import uuid
            self.ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class TicketComment(models.Model):
    """
    Comments and updates on support tickets.
    """
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='comments')
    
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='ticket_comments')
    
    comment_text = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_internal = models.BooleanField(default=False)  # Internal notes not visible to customer
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment on {self.ticket.ticket_id}"


# ==================== INTERACTION/ACTIVITY MODEL ====================
class CustomerInteraction(models.Model):
    """
    Track all interactions with a customer (calls, emails, meetings, notes).
    """
    INTERACTION_TYPE_CHOICES = [
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('note', 'Note'),
        ('task', 'Task'),
        ('other', 'Other'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_interactions')
    
    interaction_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Follow-up
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-interaction_date']
    
    def __str__(self):
        return f"{self.customer.email} - {self.interaction_type} - {self.interaction_date}"


# ==================== SIGNAL HANDLERS ====================
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)
