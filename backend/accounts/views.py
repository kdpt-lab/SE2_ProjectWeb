from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
# ✅ Make sure AllowAny is imported
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from django.utils import timezone  # ✅ ADD THIS IMPORT

from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    LoginActivitySerializer, 
    ServiceSerializer,
    ProductSerializer,
    OrderSerializer,
    StaffProfileSerializer, 
    PetProfileSerializer,
    FeedbackSerializer,
    AppointmentSerializer, # ✅ NEW: Appointment Serializer
)
from .models import (
    LoginActivity, 
    UserProfile, 
    Service, 
    Product, 
    Order, 
    PetProfile,
    Feedback,
    Appointment, # ✅ NEW: Appointment Model
)


# ===============================================
# AUTHENTICATION & USER MANAGEMENT VIEWS 
# ===============================================
class RegisterUserView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'is_staff': False})
        if serializer.is_valid():
            user = serializer.save()
            UserProfile.objects.create(user=user, role='user', status='Active')
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterAdminView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'is_staff': True})
        if serializer.is_valid():
            user = serializer.save()
            UserProfile.objects.create(user=user, role='admin', status='Active')
            return Response({"message": "Admin registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            LoginActivity.objects.create(user=user, status='Active' if user.is_active else 'Blocked')
            return Response({
                "username": user.username, "email": user.email, "is_staff": user.is_staff,
                "access": str(refresh.access_token), "refresh": str(refresh),
                "message": "Login successful"
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        new_password = request.data.get("new_password", "")
        if not new_password:
            return Response({"message": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
        user.password = make_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        if not user.is_active:
            return Response({"message": "Account already deactivated."}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        profile = getattr(user, 'userprofile', None)
        if profile:
            profile.status = 'Blocked'
            profile.save()
        return Response({"message": "Account deactivated successfully."}, status=status.HTTP_200_OK)

class LoginActivityView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response({"message": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        logs = LoginActivity.objects.all().order_by('-login_time')
        data = [{"id": log.id, "username": log.user.username, "login_time": log.login_time, 
                  "role": "admin" if log.user.is_staff else "user", 
                  "status": "Blocked" if not log.user.is_active else "Active"} for log in logs]
        return Response(data, status=status.HTTP_200_OK)

class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, username):
        if not request.user.is_staff:
            return Response({"message": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(username=username)
            profile = getattr(user, 'userprofile', None)
            is_blocking = user.is_active
            user.is_active = not user.is_active
            if profile:
                profile.status = 'Blocked' if is_blocking else 'Active'
                profile.save()
            user.save()
            message = f"{username} has been {'blocked' if is_blocking else 'unblocked'}"
            return Response({"message": message}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

# Order Views (From previous step)
class OrderListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        if request.user.is_staff:
            orders = Order.objects.all().order_by('-order_date')
        else:
            orders = Order.objects.filter(user=request.user).order_by('-order_date')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ===============================================
# SERVICE API VIEWS (EXISTING)
# ===============================================
class ServiceListView(APIView):
    permission_classes = [IsAuthenticated] 
    def get(self, request, format=None):
        services = Service.objects.all().order_by('-created_at')
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ServiceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ServiceDetailView(APIView):
    permission_classes = [IsAuthenticated] 
    def get_object(self, pk):
        return get_object_or_404(Service, pk=pk)
    def get(self, request, pk, format=None):
        service = self.get_object(pk)
        serializer = ServiceSerializer(service)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        service = self.get_object(pk)
        serializer = ServiceSerializer(service, data=request.data) 
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        service = self.get_object(pk)
        service.delete()
        return Response({"message": "Service deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

@api_view(['PATCH'])
def toggle_service_availability(request, pk):
    if not request.user.is_staff:
        return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
    try:
        service = Service.objects.get(pk=pk)
    except Service.DoesNotExist:
        return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
    service.availability = not service.availability
    service.save()
    return Response(ServiceSerializer(service).data, status=status.HTTP_200_OK)

# ===============================================
# 📦 NEW: PRODUCT API VIEWS
# ===============================================
class ProductListView(APIView):
    permission_classes = [IsAuthenticated] 
    def get(self, request, format=None):
        products = Product.objects.all().order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated] 
    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)
    def get(self, request, pk, format=None):
        product = self.get_object(pk)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
            
        product = self.get_object(pk)
        serializer = ProductSerializer(product, data=request.data) 
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
            
        product = self.get_object(pk)
        product.delete()
        return Response({"message": "Product deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

@api_view(['PATCH'])
def toggle_product_availability(request, pk):
    if not request.user.is_staff:
        return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    product.is_available = not product.is_available
    product.save()
    return Response(ProductSerializer(product).data, status=status.HTTP_200_OK)

# ===============================================
# 📦 NEW: INVENTORY VIEW
# ===============================================
class InventoryView(APIView):
    permission_classes = [IsAuthenticated] 
    
    def get(self, request, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)
        
        products = Product.objects.all().order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# ===============================================
# ✅ NEW: STAFF MANAGEMENT VIEWS 
# ===============================================
class StaffUserListView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, format=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profiles = UserProfile.objects.all().select_related('user')
        serializer = StaffProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StaffUpdateProfileView(APIView):
    permission_classes = [IsAuthenticated] 

    def patch(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Access denied. Admin privileges required for updates."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = get_object_or_404(User, pk=pk)
        profile = get_object_or_404(UserProfile, user=user)
        serializer = StaffProfileSerializer(profile, data=request.data, partial=True)
        
        print(f"*** PATCH DATA RECEIVED: {request.data}") 

        if serializer.is_valid():
            updated_profile = serializer.save()
            return Response(StaffProfileSerializer(updated_profile).data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.pk == pk:
            return Response(
                {"detail": "Cannot delete your own account via the staff management panel."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user_to_delete = User.objects.get(pk=pk)
            user_to_delete.delete()
            return Response({"message": f"User ID {pk} deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
# ===============================================
# ✅ NEW: PET PROFILE VIEWS 
# ===============================================
class PetProfileListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        if request.user.is_staff:
            pets = PetProfile.objects.all().order_by('-created_at')
        else:
            pets = PetProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = PetProfileSerializer(pets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Staff privileges required."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PetProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PetProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        return get_object_or_404(PetProfile, pk=pk)
        
    def delete(self, request, pk, format=None):
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Staff privileges required."}, status=status.HTTP_403_FORBIDDEN)

        pet = self.get_object(pk)
        pet.delete()
        return Response({"message": "Pet profile deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        
# ===============================================
# ✅ NEW: FEEDBACK VIEWS
# ===============================================
# This view handles POST to /api/accounts/feedback/
class FeedbackCreateView(APIView):
    permission_classes = [IsAuthenticated] # Only logged-in users can send feedback

    def post(self, request, format=None):
        """Creates a new feedback entry."""
        serializer = FeedbackSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# This view handles GET to /api/accounts/feedback/gallery/
class FeedbackGalleryView(APIView):
    # Allow anyone (authenticated or not) to view the gallery
    permission_classes = [AllowAny] 

    def get(self, request, format=None):
        """Returns a list of all feedback for the gallery."""
        feedbacks = Feedback.objects.all().order_by('-submitted_at')
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ===============================================
# ✅ NEW: APPOINTMENT VIEWS 
# ===============================================

# 1. Handles POST /api/accounts/appointments/ (Create Appointment)
class AppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        """Creates a new appointment."""
        serializer = AppointmentSerializer(data=request.data, context={'request': request})
        
        # DEBUG: Print data received from frontend
        print(f"*** APPOINTMENT DATA RECEIVED: {request.data}")
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # DEBUG: Print validation errors if data is invalid
        print(f"*** APPOINTMENT VALIDATION FAILED: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 2. Handles GET /api/accounts/appointments/booked/ (List booked slots for calendar)
class AppointmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        """Returns a list of confirmed appointments for calendar display."""
        # FIX: Query start_time and end_time (from new model)
        appointments = Appointment.objects.filter(status='Confirmed').select_related('service', 'user').order_by('start_time')
        
        data = []
        for appt in appointments:
            # FIX: Add defensive check for None values
            if appt.start_time and appt.end_time:
                data.append({
                    'id': appt.id, 
                    'service_id': appt.service.id,
                    'service_name': appt.service.name,
                    'start_time': appt.start_time.isoformat(), 
                    'end_time': appt.end_time.isoformat(),
                    'user_username': appt.user.username, # ✅ FIX: Added username
                })
        
        return Response(data, status=status.HTTP_200_OK)

# 3. Handles DELETE /api/accounts/appointments/{id}/ (Cancel Appointment)
class AppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        return get_object_or_404(Appointment, pk=pk)
        
    def delete(self, request, pk, format=None):
        """Deletes (cancels) an appointment."""
        appt = self.get_object(pk)
        
        # Security check: Ensure user owns the appointment or is an Admin
        if appt.user != request.user and not request.user.is_staff:
            return Response({"detail": "You do not have permission to cancel this appointment."}, 
                            status=status.HTTP_403_FORBIDDEN)

        appt.delete()
        return Response({"message": "Appointment cancelled successfully."}, status=status.HTTP_204_NO_CONTENT)

# 4. NEW: Handles GET /api/accounts/appointments/all/ (Get all appointments for admin)
class AppointmentAdminListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        """Returns all appointments for admin management."""
        if not request.user.is_staff:
            return Response({"detail": "Unauthorized. Admins only."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        appointments = Appointment.objects.all().select_related('service', 'user').order_by('start_time')
        
        data = []
        for appt in appointments:
            if appt.start_time and appt.end_time:
                data.append({
                    'id': appt.id, 
                    'service_id': appt.service.id,
                    'service_name': appt.service.name,
                    'start_time': appt.start_time.isoformat(), 
                    'end_time': appt.end_time.isoformat(),
                    'user_username': appt.user.username,
                    'user_id': appt.user.id,
                    'status': appt.status,
                    'booked_at': appt.booked_at.isoformat() if appt.booked_at else None,
                })
        
        return Response(data, status=status.HTTP_200_OK)

# 5. NEW: Handles GET /api/accounts/appointments/my-upcoming/ (Get current user's upcoming appointments)
class MyUpcomingAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        """Returns only the current user's upcoming appointments."""
        today = timezone.now()  # ✅ FIXED: Now using imported timezone
        appointments = Appointment.objects.filter(
            user=request.user, 
            status='Confirmed',
            start_time__gte=today
        ).select_related('service').order_by('start_time')
        
        data = []
        for appt in appointments:
            if appt.start_time and appt.end_time:
                data.append({
                    'id': appt.id, 
                    'service_id': appt.service.id,
                    'service_name': appt.service.name,
                    'start_time': appt.start_time.isoformat(), 
                    'end_time': appt.end_time.isoformat(),
                    'user_username': appt.user.username,
                })
        
        return Response(data, status=status.HTTP_200_OK)