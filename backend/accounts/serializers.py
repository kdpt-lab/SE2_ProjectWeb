from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
# ✅ PetProfile, Feedback, and Appointment added to imports
from .models import LoginActivity, Service, UserProfile, Order, Product, PetProfile, Feedback, Appointment 
# ✅ Import timedelta for time calculations
from datetime import timedelta


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        is_staff = self.context.get('is_staff', False)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        user.is_staff = is_staff
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user:
            return user
        raise serializers.ValidationError("Invalid credentials")


class LoginActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = LoginActivity
        fields = ['id', 'username', 'login_time', 'role', 'status']

    def get_role(self, obj):
        # Fetch role from UserProfile for accuracy
        profile = getattr(obj.user, 'userprofile', None)
        return profile.role if profile else "user" 

    def get_status(self, obj):
        return "Active" if obj.user.is_active else "Blocked"


# Service Serializer (Your existing serializer)
class ServiceSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Service
        # FIX: Changed 'duration' to 'duration_minutes'
        fields = ['id', 'name', 'description', 'included', 'duration_minutes', 'cost', 'availability', 'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['created_by', 'created_at'] 

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# Order Serializer (From previous step)
class OrderSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'username', 'service', 'service_name', 'order_date', 'status', 'total_cost']
        read_only_fields = ['user', 'total_cost']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
            
        service = validated_data['service']
        validated_data['total_cost'] = service.cost
        
        return super().create(validated_data)

# Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True) 

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'unit_of_measure', 'stocks', 'price', 'is_available', 'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['created_by', 'created_at'] 

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# Pet Profile Serializer (From previous step)
class PetProfileSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = PetProfile
        fields = ['id', 'pet_name', 'pet_breed', 'age', 'allergies', 'notes', 'pet_picture', 'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['created_by', 'created_at']
        
    def create(self, validated_data):
        # Automatically set the user who created the pet profile
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# Feedback Serializer (From previous step)
class FeedbackSerializer(serializers.ModelSerializer):
    # This field is used by the Gallery view to display who left the feedback
    username = serializers.CharField(source='user.username', read_only=True) 

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'username', 'rating', 'feedback_text', 'submitted_at']
        read_only_fields = ['user', 'submitted_at'] 

    def create(self, validated_data):
        # Automatically link the feedback to the currently authenticated user
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # Validation to ensure rating is within 1-5 range (optional, but good practice)
        rating = validated_data.get('rating')
        if not 1 <= rating <= 5:
             raise serializers.ValidationError({"rating": "Rating must be between 1 and 5."})

        return super().create(validated_data)


# Staff Management Serializer
class StaffProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        # Ensure all fields are explicitly listed
        fields = ['id', 'username', 'email', 'role', 'status', 'branch']
        
    def update(self, instance, validated_data):
        # Update UserProfile fields (role and branch are primary targets)
        instance.role = validated_data.get('role', instance.role)
        instance.branch = validated_data.get('branch', instance.branch)
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        
        # IMPORTANT LOGIC: Synchronize Django's built-in is_staff flag
        user = instance.user
        new_role = validated_data.get('role', instance.role)
        
        # If promoting to staff/manager role, set user.is_staff = True
        if new_role == 'admin' or new_role == 'manager':
            if not user.is_staff:
                user.is_staff = True
                user.save()
        # If demoting to a regular user role, set user.is_staff = False
        elif user.is_staff and new_role == 'user':
             user.is_staff = False
             user.save()
             
        return instance

# ===============================================
# APPOINTMENT SERIALIZER (FIXED)
# ===============================================

class AppointmentSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for incoming 'service' ID
    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True
    )
    # Use DateTimeField for incoming 'start_time' string
    start_time = serializers.DateTimeField()

    # Read-only fields for a nice response
    user_username = serializers.CharField(source='user.username', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Appointment
        # FIX: Updated fields to match the new model
        fields = [
            'id', 'user', 'user_username', 'service', 'service_name', 
            'start_time', 'end_time', 'status', 'booked_at'
        ]
        read_only_fields = [
            'user', 'status', 'booked_at', 'user_username', 
            'service_name', 'end_time' # end_time is calculated, not provided by user
        ] 
        
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # --- DURATION LOGIC ---
        # Get the service object (which was validated by PrimaryKeyRelatedField)
        service = validated_data.get('service')
        start_time = validated_data.get('start_time')
        
        # Calculate end_time based on service duration
        duration_in_minutes = service.duration_minutes
        end_time = start_time + timedelta(minutes=duration_in_minutes)
        
        validated_data['end_time'] = end_time
        # --- END DURATION LOGIC ---
        
        validated_data['status'] = 'Confirmed'
        
        return super().create(validated_data)

