from django.db import models
from django.contrib.auth.models import User

# Define custom role choices for fine-grained staff control (Updated from ROLE_CHOICES)
STAFF_ROLE_CHOICES = (
    ('user', 'User'),
    ('manager', 'Manager'),  # New staff role for management
    ('admin', 'Admin'),      # Highest level administrator
)

STATUS_CHOICES = (
    ('Pending', 'Pending'),
    ('Confirmed', 'Confirmed'),
    ('Cancelled', 'Cancelled'),
    ('Completed', 'Completed'),
)

# User Profile Model (Existing)
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=STAFF_ROLE_CHOICES, default='user') 
    status = models.CharField(max_length=10, default='Active')  # Active or Blocked
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True) 

    def __str__(self):
        return self.user.username


# Login Activity Model (Existing)
class LoginActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    login_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, default="Active") 

    def role(self):
        profile = getattr(self.user, 'userprofile', None)
        return profile.role if profile else "user" 

    def __str__(self):
        return f"{self.user.username} - {self.login_time}"


class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    login_time = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=50) 
    status = models.CharField(max_length=20, default="Active") 

    def __str__(self):
        return f"{self.user.username} - {self.login_time}"


# Service model (Existing)
class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    included = models.TextField(blank=True, null=True) 
    duration = models.CharField(max_length=50)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Order model (Existing)
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order {self.id} by {self.user.username} - {self.service.name}"

# Product Model (Existing)
class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default='Food') 
    unit_of_measure = models.CharField(max_length=20, default='piece') 
    stocks = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Pet Profile Model (Existing)
class PetProfile(models.Model):
    pet_name = models.CharField(max_length=100)
    pet_breed = models.CharField(max_length=100)
    age = models.CharField(max_length=50) # Stored as "6 Months" or "2 Years"
    allergies = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    pet_picture = models.ImageField(upload_to='pet_pics/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pet_name} ({self.pet_breed})"

# Feedback Model (Existing)
class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField() # Expects 1-5 star rating
    feedback_text = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Feedback by {self.user.username if self.user else 'Anonymous'} - {self.rating} stars"

# ===============================================
# ✅ NEW: APPOINTMENT MODEL
# ===============================================

class Appointment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    # Storing date as a CharField to easily match the frontend 'YYYY-MM-DD' string
    appointment_date = models.CharField(max_length=10) 
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Confirmed')
    booked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} for {self.user.username} on {self.appointment_date}"
