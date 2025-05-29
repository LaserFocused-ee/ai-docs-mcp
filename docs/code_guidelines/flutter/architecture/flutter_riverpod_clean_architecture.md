# Flutter Riverpod Clean Architecture

This document outlines the Clean Architecture pattern for Flutter applications using Riverpod, demonstrating how to organize code to create maintainable, testable applications.

## Overview

The architecture divides the application into distinct layers with clear responsibilities, following clean architecture principles while leveraging Riverpod for state management.

## Core Principles

- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Rule**: Dependencies point inward, with inner layers having no knowledge of outer layers
- **Abstraction at Boundaries**: Interfaces define boundaries between layers
- **Testability**: All components can be tested independently
- **Riverpod Integration**: Providers connect layers together while maintaining clean architecture principles

## Directory Structure

```
/features
  /user_management  (or any feature)
    /application      # Application layer
      /models         # Application-specific state models
      /providers      # Data providers that manage feature state
      /services       # Business logic services
    /data             # Data layer
      /datasources    # API clients and data sources
      /models         # DTOs (Data Transfer Objects)
      /repositories   # Concrete repository implementations
    /domain           # Domain layer
      /models         # Domain entities/models (business objects)
      /repositories   # Repository interfaces
    /presentation     # Presentation layer
      /controllers    # UI state controllers
      /models         # UI state models
      /pages          # Full page screens
      /widgets        # UI components
```

## Layer Details

### 1. Domain Layer

The innermost layer containing business logic and rules, independent of any outer layer.

**Key Components:**

- **Entities**: Core business data models
- **Repository Interfaces**: Define data access contracts
- **Domain Exceptions**: Business-specific error types

**Characteristics:**

- No dependencies on Flutter, Riverpod, or other external frameworks
- Pure Dart classes with business logic
- Often uses [Freezed](https://pub.dev/packages/freezed) for immutable models

```dart
// Entity example
class User {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final bool isActive;
}

// Repository interface
abstract class UserRepositoryInterface {
  Future<List<User>> getUsers({UserRole? role, bool? isActive});
  Future<User> getUserById(String userId);
  Future<User> createUser(CreateUserRequest request);
}

// Domain exception
class UserException implements Exception {
  final String message;
  final UserErrorType type;
}
```

### 2. Data Layer

Implements data access and repository interfaces defined in the domain layer.

**Key Components:**

- **Repositories**: Implement domain repository interfaces
- **Data Sources**: API clients, databases, local storage
- **Repository Providers**: Make repositories available

**Characteristics:**

- Depends only on domain layer and external libraries
- Handles data conversion between domain models and DTOs
- Uses Riverpod providers to expose repositories

```dart
// Repository implementation
class UserRepository implements UserRepositoryInterface {
  final UserApi _api;
  
  @override
  Future<List<User>> getUsers({UserRole? role, bool? isActive}) async {
    try {
      final filters = UserFilters(role: role, isActive: isActive);
      return await _api.getUsers(filters);
    } catch (e) {
      throw UserException(message: 'Failed to fetch users', type: UserErrorType.fetchFailed);
    }
  }
}

// Repository provider
@riverpod
UserRepository userRepository(UserRepositoryRef ref) {
  return UserRepository(ref.watch(userApiProvider));
}
```

### 3. Application Layer

Orchestrates the flow of data and business rules, connecting domain logic to the presentation layer.

**Key Components:**

- **Services**: Coordinate complex operations
- **Application State Providers**: Manage feature data state

**Characteristics:**

- Acts as a bridge between data and presentation layers
- Coordinates complex operations across multiple repositories
- Contains business logic that doesn't belong in domain entities

```dart
// Service
@riverpod
class UserService {
  final Ref _ref;
  
  Future<void> loadUsers({UserRole? role, bool? isActive}) async {
    final repository = _ref.read(userRepositoryProvider);
    final users = await repository.getUsers(role: role, isActive: isActive);
    _ref.read(userDataProvider.notifier).setUsers(users);
  }
}

// Data provider
@Riverpod(keepAlive: true)
class UserData extends _$UserData {
  @override
  FutureOr<UserDataState> build() => UserDataState.initial();
  
  void setUsers(List<User> users) {
    state = AsyncData(UserDataState(users: users, lastUpdated: DateTime.now()));
  }
}
```

### 4. Presentation Layer

Manages UI components, user interactions, and presentation-specific state.

**Key Components:**

- **Controllers**: Handle UI state and user actions
- **UI Models**: Presentation-specific state models
- **Pages and Widgets**: UI components

**Characteristics:**

- Contains UI-specific logic and state
- Delegates business operations to services and application layer
- Uses Riverpod's AsyncValue for handling loading/error/data states

```dart
// Controller
@riverpod
class UserController extends _$UserController {
  late final UserService _service;
  
  @override
  FutureOr<UserUiState> build() {
    _service = ref.read(userServiceProvider);
    return UserUiState.initial();
  }
  
  Future<void> loadUsers() async {
    state = AsyncData(state.valueOrNull?.copyWith(isLoading: true) ?? UserUiState.initial());
    try {
      await _service.loadUsers();
      state = AsyncData(state.valueOrNull?.copyWith(isLoading: false) ?? UserUiState.initial());
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}

// UI State
class UserUiState {
  final bool isLoading;
  final String? selectedUserId;
  final UserFormMode formMode;
  
  static UserUiState initial() => UserUiState(isLoading: false, formMode: UserFormMode.view);
}
```

## State Management with Riverpod

### Key Provider Types

1. **Repository Providers**: Connect domain interfaces to data implementations
2. **Data Providers**: Keep the source of truth for application state (usually with `keepAlive: true`)
3. **Service Providers**: Orchestrate complex business operations
4. **Controller Providers**: Manage UI-specific state and user interactions

### State Flow

1. **User interactions** → controller methods
2. **Controllers** → delegate to services + update UI state
3. **Services** → coordinate repositories + data providers
4. **Data providers** → update application state
5. **Controllers** → listen to data changes + update UI state
6. **UI components** → rebuild based on controller state

### ViewModel Providers for Complex UI State

When UI components need both controller state and data state, use ViewModel providers:

```dart
@riverpod
class UserScreenState extends _$UserScreenState {
  @override
  AsyncValue<UserScreenViewModel> build() {
    final controllerState = ref.watch(userControllerProvider);
    final dataState = ref.watch(userDataProvider);
    
    // Handle loading/error states
    if (controllerState is AsyncLoading || dataState is AsyncLoading) {
      return const AsyncLoading();
    }
    if (controllerState is AsyncError) return AsyncError(controllerState.error, controllerState.stackTrace);
    if (dataState is AsyncError) return AsyncError(dataState.error, dataState.stackTrace);
    
    // Combine states
    final uiState = controllerState.value!;
    final users = dataState.value!.users;
    
    return AsyncData(UserScreenViewModel(
      uiState: uiState,
      users: users,
      statistics: UserStatistics(totalUsers: users.length, activeUsers: users.where((u) => u.isActive).length),
    ));
  }
}

class UserScreenViewModel {
  final UserUiState uiState;
  final List<User> users;
  final UserStatistics statistics;
  
  bool get isLoading => uiState.isLoading;
  bool get hasUsers => users.isNotEmpty;
}
```

**Benefits:**

- Single AsyncValue handler in UI components
- Cleaner UI code without nested .when() calls
- Centralized error handling for multiple data sources
- Pre-computed properties for UI consumption

## Testing Strategy

- **Domain Layer**: Pure unit tests, no framework dependencies
- **Data Layer**: Test repositories with mocked data sources
- **Application Layer**: Test services with mocked repositories, test providers using ProviderContainer
- **Presentation Layer**: Test controllers with mocked services, widget tests for UI components
- **Integration Tests**: End-to-end feature functionality

## Best Practices

1. **Keep Layers Separate**: Don't mix domain logic with UI code
2. **Use Interfaces at Boundaries**: Define clear contracts between layers
3. **Maintain Unidirectional Data Flow**: Data flows repositories → services → controllers → UI
4. **Separate UI State from Data State**: UI state = presentation concerns, Data state = domain objects
5. **Use ViewModel Providers for Complex UI State**: Avoid nested AsyncValue handling
6. **Avoid StatefulWidget in Feature Code**: Use ConsumerWidget with providers instead
7. **Leverage Riverpod Features**: Use code generation, AsyncValue, and listeners

## Complete Example

```dart
// Domain Layer
abstract class ProductRepositoryInterface {
  Future<List<Product>> getProducts({String? category, bool? inStock});
  Future<Product> createProduct(CreateProductRequest request);
}

class Product {
  final String id;
  final String name;
  final double price;
  final bool inStock;
}

// Data Layer
class ProductRepository implements ProductRepositoryInterface {
  final ProductApi _api;
  
  @override
  Future<List<Product>> getProducts({String? category, bool? inStock}) async {
    try {
      return await _api.getProducts(ProductFilters(category: category, inStock: inStock));
    } catch (e) {
      throw ProductException('Failed to fetch products');
    }
  }
}

@riverpod
ProductRepository productRepository(ProductRepositoryRef ref) {
  return ProductRepository(ref.watch(productApiProvider));
}

// Application Layer
@riverpod
class ProductService {
  final Ref _ref;
  
  Future<void> loadProducts({String? category}) async {
    final repository = _ref.read(productRepositoryProvider);
    final products = await repository.getProducts(category: category);
    _ref.read(productDataProvider.notifier).setProducts(products);
  }
}

@Riverpod(keepAlive: true)
class ProductData extends _$ProductData {
  @override
  FutureOr<List<Product>> build() => [];
  
  void setProducts(List<Product> products) => state = AsyncData(products);
}

// Presentation Layer
@riverpod
class ProductController extends _$ProductController {
  @override
  FutureOr<ProductUiState> build() => ProductUiState.initial();
  
  Future<void> loadProducts() async {
    await ref.read(productServiceProvider).loadProducts();
  }
}

class ProductScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productDataProvider);
    final uiState = ref.watch(productControllerProvider);
    
    return Scaffold(
      body: products.when(
        data: (productList) => ProductListView(products: productList),
        loading: () => const CircularProgressIndicator(),
        error: (error, stack) => Text('Error: $error'),
      ),
    );
  }
}
```

## Conclusion

This Flutter Riverpod Clean Architecture pattern provides:

- **Maintainability**: Clear separation of concerns
- **Testability**: Every component can be tested in isolation
- **Scalability**: Features can be developed independently
- **Readability**: Consistent structure across features

By following these patterns, you can build Flutter applications that are easier to maintain, test, and extend over time.
