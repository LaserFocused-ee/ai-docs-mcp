# Flutter Riverpod Clean Architecture

This document outlines the Clean Architecture pattern used in the LaserLingoApp project, demonstrating how Flutter and Riverpod can be organized to create maintainable, testable applications.

## Overview

The architecture divides the application into distinct layers with clear responsibilities, following clean architecture principles while leveraging Riverpod for state management.

![Clean Architecture Diagram](https://raw.githubusercontent.com/ResoCoder/flutter-tdd-clean-architecture-course/master/architecture-proposal.png)

## Core Principles

- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Rule**: Dependencies point inward, with inner layers having no knowledge of outer layers
- **Abstraction at Boundaries**: Interfaces define boundaries between layers
- **Testability**: All components can be tested independently
- **Riverpod Integration**: Providers connect layers together while maintaining clean architecture principles

## Directory Structure

The project follows a feature-first organization, with each feature containing its own implementation of the clean architecture layers:

```
/features
  /grammar_exercises  (or any feature)
    /application      # Application layer
      /models         # Application-specific state models
      /providers      # Data providers that manage feature state
      /services       # Business logic services
      /utils          # Feature-specific utilities
    /data             # Data layer
      /datasources    # API clients and data sources
      /exceptions     # Data layer exceptions
      /models         # DTOs (Data Transfer Objects)
      /providers      # Repository providers
      /repositories   # Concrete repository implementations
    /domain           # Domain layer
      /exceptions     # Domain-specific exceptions
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

#### Key Components:

- **Entities**: Core business data models
  ```dart
  class GrammarExercise {
    final String id;
    final String sentence;
    final String translatedSentence;
    final String form;
    final List<String> options;
    final int correctOptionIndex;
    final String explanation;
    final String wordTranslationId;
    final String languageCode;
    
    // Constructor, methods, etc.
  }
  ```

- **Repository Interfaces**: Define data access contracts
  ```dart
  abstract class GrammarExercisesRepositoryInterface {
    Future<List<GrammarExercise>> getExercises({
      required String languageCode,
      List<String>? formKeys,
      FormType? formType,
      ImportanceGroup? importanceGroup,
      int? limit,
      String? clientSeed,
    });
    
    // Other method declarations
  }
  ```

- **Domain Exceptions**: Business-specific error types
  ```dart
  class GrammarExercisesException implements Exception {
    final String message;
    final String source;
    // Constructor, methods, etc.
  }
  ```

#### Characteristics:
- No dependencies on Flutter, Riverpod, or other external frameworks
- No dependencies on other layers
- Pure Dart classes with business logic
- Often uses [Freezed](https://pub.dev/packages/freezed) for immutable models

### 2. Data Layer

Implements data access and repository interfaces defined in the domain layer.

#### Key Components:

- **Repositories**: Implement domain repository interfaces
  ```dart
  class GrammarExercisesRepository implements GrammarExercisesRepositoryInterface {
    final GrammarExercisesApi _api;
    
    GrammarExercisesRepository(this._api);
    
    @override
    Future<List<GrammarExercise>> getExercises({
      required String languageCode,
      List<String>? formKeys,
      FormType? formType,
      ImportanceGroup? importanceGroup,
      int? limit,
      String? clientSeed,
    }) async {
      // Implementation that uses the API
      try {
        final options = ExerciseOptions(/* parameters */);
        return await _api.getExercises(options);
      } catch (e) {
        throw GrammarExercisesException(/* error details */);
      }
    }
    
    // Other method implementations
  }
  ```

- **Data Sources**: API clients, databases, local storage
  ```dart
  class GrammarExercisesApi {
    final Dio _dio;
    
    Future<List<GrammarExercise>> getExercises(ExerciseOptions options) async {
      // Implementation of API call
    }
  }
  ```

- **Repository Providers**: Make repositories available
  ```dart
  @riverpod
  GrammarExercisesRepository grammarExercisesRepository(
      GrammarExercisesRepositoryRef ref) {
    return GrammarExercisesRepository(ref.watch(grammarExercisesApiProvider));
  }
  ```

#### Characteristics:
- Depends only on domain layer and external libraries
- Handles data conversion between domain models and DTOs
- Implements error handling and data transformation
- Uses Riverpod providers to expose repositories to other layers

### 3. Application Layer

Orchestrates the flow of data and business rules, connecting domain logic to the presentation layer.

#### Key Components:

- **Services**: Coordinate complex operations
  ```dart
  @riverpod
  GrammarExerciseService grammarExerciseService(GrammarExerciseServiceRef ref) {
    return GrammarExerciseService(ref);
  }
  
  class GrammarExerciseService {
    final Ref _ref;
    
    GrammarExerciseService(this._ref);
    
    Future<void> startExerciseSession({
      required String languageCode,
      required List<String> formKeys,
      FormType? formType,
      ImportanceGroup? importanceGroup,
      int limit = 10,
    }) async {
      // Implementation that coordinates repositories and state
      final repository = _ref.read(grammarExercisesRepositoryProvider);
      final exercises = await repository.getExercises(/* parameters */);
      
      // Update state with new exercises
      _ref.read(grammarExercisesDataProvider.notifier).setExercises(
        exercises,
        sessionConfig: {/* config */},
        sessionId: sessionId,
      );
    }
    
    // Other methods
  }
  ```

- **Application State Providers**: Manage feature data state
  ```dart
  @Riverpod(keepAlive: true)
  class GrammarExercisesData extends _$GrammarExercisesData {
    @override
    FutureOr<GrammarExercisesDataState> build() {
      return GrammarExercisesDataState.initial();
    }
    
    void setExercises(List<GrammarExercise> exercises, {
      required Map<String, dynamic> sessionConfig,
      required String sessionId,
    }) {
      state = AsyncData(GrammarExercisesDataState(
        exercises: exercises,
        currentIndex: 0,
        sessionConfig: sessionConfig,
        sessionId: sessionId,
      ));
    }
    
    // Other state mutation methods
  }
  ```

#### Characteristics:
- Acts as a bridge between data and presentation layers
- Coordinates complex operations across multiple repositories
- Manages application state through providers
- Contains business logic that doesn't belong in domain entities
- Uses dependency injection through Riverpod's ref

### 4. Presentation Layer

Manages UI components, user interactions, and presentation-specific state.

#### Key Components:

- **Controllers**: Handle UI state and user actions
  ```dart
  @riverpod
  class GrammarExercisesController extends _$GrammarExercisesController {
    late final GrammarExerciseService _service;
    
    @override
    FutureOr<GrammarExerciseUiState> build() {
      _service = ref.read(grammarExerciseServiceProvider);
      
      // Set up listener for data state changes
      _updateFromDataState();
      
      return GrammarExerciseUiState.initial();
    }
    
    Future<void> submitAnswer(int answerIndex) async {
      _service.submitAnswer(answerIndex);
    }
    
    // Other UI methods
  }
  ```

- **UI Models**: Presentation-specific state models
  ```dart
  class GrammarExerciseUiState {
    final bool isFormSelectionMode;
    final bool isLoading;
    final bool isReviewingAnswer;
    final bool isSessionCompleted;
    
    // Constructor, methods, etc.
    
    static GrammarExerciseUiState initial() {
      return GrammarExerciseUiState(
        isFormSelectionMode: true,
        isLoading: false,
        isReviewingAnswer: false,
        isSessionCompleted: false,
      );
    }
  }
  ```

- **Pages and Widgets**: UI components
  ```dart
  class GrammarExercisesScreen extends ConsumerWidget {
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final uiState = ref.watch(grammarExercisesControllerProvider);
      
      return uiState.when(
        data: (state) {
          if (state.isFormSelectionMode) {
            return FormSelector(
              onFormSelected: (languageCode, formKeys) {
                ref.read(grammarExercisesControllerProvider.notifier)
                  .startExerciseSession(
                    languageCode: languageCode,
                    formKeys: formKeys,
                  );
              },
            );
          } else if (state.isSessionCompleted) {
            return ExerciseResultsScreen();
          } else {
            return ExerciseView();
          }
        },
        loading: () => LoadingIndicator(),
        error: (error, stackTrace) => ErrorWidget(error.toString()),
      );
    }
  }
  ```

#### Characteristics:
- Contains UI-specific logic and state
- Delegates business operations to services and application layer
- Uses Riverpod's AsyncValue for handling loading/error/data states
- Consumes application state but also manages UI-only state
- No direct dependency on repositories or data sources

## State Management with Riverpod

This architecture leverages Riverpod's code generation approach for efficient state management:

### Key Provider Types

1. **Repository Providers**
   - Connect domain interfaces to data implementations
   - Usually simple providers that return repository instances
   ```dart
   @riverpod
   GrammarExercisesRepository grammarExercisesRepository(GrammarExercisesRepositoryRef ref) {
     return GrammarExercisesRepository(ref.watch(grammarExercisesApiProvider));
   }
   ```

2. **Data Providers**
   - Keep the source of truth for application state
   - Usually class-based with keepAlive: true
   - Contain methods for state mutations
   ```dart
   @Riverpod(keepAlive: true)
   class GrammarExercisesData extends _$GrammarExercisesData {
     @override
     FutureOr<GrammarExercisesDataState> build() {
       return GrammarExercisesDataState.initial();
     }
     
     void setExercises(List<GrammarExercise> exercises, {/*...*/}) {
       // Update state
     }
   }
   ```

3. **Service Providers**
   - Orchestrate complex business operations
   - Connect repositories and state providers
   ```dart
   @riverpod
   GrammarExerciseService grammarExerciseService(GrammarExerciseServiceRef ref) {
     return GrammarExerciseService(ref);
   }
   ```

4. **Controller Providers**
   - Manage UI-specific state and user interactions
   - Delegate business operations to services
   ```dart
   @riverpod
   class GrammarExercisesController extends _$GrammarExercisesController {
     @override
     FutureOr<GrammarExerciseUiState> build() {
       // Setup and initial state
     }
     
     // UI state methods
   }
   ```

### State Flow

1. **User interactions** trigger controller methods
2. **Controllers** delegate to service methods and update UI state
3. **Services** coordinate repositories and data providers
4. **Data providers** update application state
5. **Controllers** listen to data provider changes and update UI state
6. **UI components** rebuild based on controller state changes

### ViewModel Providers for UI State Composition

When a UI component needs to consume both controller state (UI-specific state) and data state (domain data), we use a dedicated ViewModel provider to combine these states instead of nesting AsyncValue handlers:

```dart
// Combined ViewModel provider for UI consumption
@riverpod
class ExerciseScreenState extends _$ExerciseScreenState {
  @override
  AsyncValue<ExerciseScreenViewModel> build() {
    // Watch both providers
    final controllerState = ref.watch(grammarExercisesControllerProvider);
    final dataState = ref.watch(grammarExercisesDataProvider);
    
    // Handle loading/error states from either provider
    if (controllerState is AsyncLoading || dataState is AsyncLoading) {
      return const AsyncLoading();
    }
    
    if (controllerState is AsyncError) {
      return AsyncError(controllerState.error, controllerState.stackTrace);
    }
    
    if (dataState is AsyncError) {
      return AsyncError(dataState.error, dataState.stackTrace);
    }
    
    // Both providers have data, combine them into a view model
    final uiState = controllerState.value!;
    final exercises = dataState.value!.exercises;
    final currentIndex = dataState.value!.currentIndex;
    
    // Return combined state as a view model
    return AsyncData(ExerciseScreenViewModel(
      uiState: uiState,
      currentExercise: exercises.isNotEmpty && currentIndex < exercises.length 
          ? exercises[currentIndex] 
          : null,
      progress: ExerciseProgress(
        totalExercises: exercises.length,
        completedExercises: dataState.value!.completedExerciseIndices.length,
        currentIndex: currentIndex,
      ),
    ));
  }
}

// View model class
class ExerciseScreenViewModel {
  final GrammarExerciseUiState uiState;
  final GrammarExercise? currentExercise;
  final ExerciseProgress progress;
  
  // Constructor
  
  // Computed properties for UI consumption
  bool get isFormSelectionMode => uiState.isFormSelectionMode;
  bool get isSessionCompleted => uiState.isSessionCompleted;
  // Other derived properties
}
```

This approach offers several benefits:
- Single AsyncValue handler in UI components
- Cleaner UI code without nested .when() calls
- Centralized error handling for multiple data sources
- Pre-computed properties for UI consumption
- Clear separation between data combination logic and presentation

## Testing Strategy

The architecture is designed for comprehensive testing at each layer:

### Domain Layer Tests

- Pure unit tests without framework dependencies
- Focus on business logic and rules
- No mocking required for entities
- Mock repositories for use case tests

### Data Layer Tests

- Test repositories with mocked data sources
- Verify data transformation and error handling
- Test API clients with HTTP mocks

### Application Layer Tests

- Test services with mocked repositories
- Verify state management and business logic
- Test providers using ProviderContainer

### Presentation Layer Tests

- Test controllers with mocked services
- Verify UI state transitions
- Test widgets with mocked controllers
- Use widget tests for UI components

### Integration Tests

- Test interaction between layers
- Verify end-to-end feature functionality
- Use golden tests for visual regression testing

## Key Benefits

1. **Maintainability**
   - Clear separation of concerns
   - Each component has a single responsibility
   - Changes in one layer don't affect others

2. **Testability**
   - Every component can be tested in isolation
   - Dependencies are easily mocked
   - Tests don't rely on implementation details

3. **Scalability**
   - Features can be developed independently
   - New components can be added without affecting others
   - Code reuse through abstraction

4. **Readability**
   - Consistent structure across features
   - Clear responsibilities for each component
   - Easily onboard new developers

## Best Practices

1. **Keep Layers Separate**
   - Don't mix domain logic with UI code
   - Don't access repositories directly from UI

2. **Use Interfaces at Boundaries**
   - Define clear contracts between layers
   - Abstract external dependencies

3. **Maintain Unidirectional Data Flow**
   - Data flows from repositories → services → controllers → UI
   - User actions flow from UI → controllers → services → repositories

4. **Separate UI State from Data State**
   - UI state should only contain presentation concerns
   - Data state should represent domain objects

5. **Use ViewModel Providers for Complex UI State**
   - Create dedicated providers that combine controller and data state
   - Avoid nested AsyncValue handling (.when inside .when)
   - Consolidate error handling from multiple state sources
   - Pre-compute derived properties needed by UI components

6. **Use Dependency Injection**
   - Inject dependencies through constructors or Riverpod
   - Avoid global state and singletons

7. **Follow the Single Responsibility Principle**
   - Each class should have only one reason to change
   - Break complex classes into smaller, focused ones

8. **Avoid StatefulWidget in Feature Code**
   - Don't use StatefulWidget or ConsumerStatefulWidget for feature screens or components
   - Limit StatefulWidget usage to design system atoms and molecules only
   - All state should be managed by controllers and providers
   - Use ConsumerWidget with providers instead of local state
   - Extract animation controllers to dedicated provider classes when needed

9. **Leverage Riverpod Features**
   - Use code generation with @riverpod annotations
   - Take advantage of AsyncValue for loading/error states
   - Use listeners to react to state changes

## Code Examples

### Example 1: Repository Interface (Domain Layer)

```dart
// Domain layer - repository interface
abstract class GrammarExercisesRepositoryInterface {
  Future<List<GrammarExercise>> getExercises({
    required String languageCode,
    List<String>? formKeys,
    FormType? formType,
    ImportanceGroup? importanceGroup,
    int? limit,
    String? clientSeed,
  });
  
  Future<GrammarExercise> getExerciseById(String exerciseId);
}
```

### Example 2: Repository Implementation (Data Layer)

```dart
// Data layer - repository implementation
class GrammarExercisesRepository implements GrammarExercisesRepositoryInterface {
  final GrammarExercisesApi _api;

  GrammarExercisesRepository(this._api);

  @override
  Future<List<GrammarExercise>> getExercises({
    required String languageCode,
    List<String>? formKeys,
    FormType? formType,
    ImportanceGroup? importanceGroup,
    int? limit,
    String? clientSeed,
  }) async {
    final options = ExerciseOptions(
      languageCode: languageCode,
      formKeys: formKeys,
      formType: formType,
      importanceGroup: importanceGroup,
      limit: limit ?? 10,
      clientSeed: clientSeed,
    );

    try {
      return await _api.getExercises(options);
    } catch (e) {
      throw GrammarExercisesException(
        message: 'Failed to fetch grammar exercises: ${e.toString()}',
        source: 'GrammarExercisesRepository.getExercises',
      );
    }
  }
}
```

### Example 3: Service (Application Layer)

```dart
// Application layer - service
@riverpod
GrammarExerciseService grammarExerciseService(GrammarExerciseServiceRef ref) {
  return GrammarExerciseService(ref);
}

class GrammarExerciseService {
  final Ref _ref;

  GrammarExerciseService(this._ref);

  Future<void> startExerciseSession({
    required String languageCode,
    required List<String> formKeys,
    FormType? formType,
    ImportanceGroup? importanceGroup,
    int limit = 10,
  }) async {
    final repository = _ref.read(grammarExercisesRepositoryProvider);
    final sessionId = const Uuid().v4();

    final exercises = await repository.getExercises(
      languageCode: languageCode,
      formKeys: formKeys,
      formType: formType,
      importanceGroup: importanceGroup,
      limit: limit,
      clientSeed: sessionId,
    );

    _ref.read(grammarExercisesDataProvider.notifier).setExercises(
      exercises,
      sessionConfig: {
        'languageCode': languageCode,
        'formKeys': formKeys,
        'formType': formType?.name,
        'importanceGroup': importanceGroup?.name,
        'limit': limit,
      },
      sessionId: sessionId,
    );
  }
}
```

### Example 4: Controller (Presentation Layer)

```dart
// Presentation layer - controller
@riverpod
class GrammarExercisesController extends _$GrammarExercisesController {
  late final GrammarExerciseService _service;

  @override
  FutureOr<GrammarExerciseUiState> build() {
    _service = ref.read(grammarExerciseServiceProvider);
    
    // Set up listener for data state changes
    _updateFromDataState();
    
    return GrammarExerciseUiState.initial();
  }

  Future<void> submitAnswer(int answerIndex) async {
    _service.submitAnswer(answerIndex);
  }
  
  void setFormSelectionMode(bool enabled) {
    final currentUiState = state.valueOrNull ?? GrammarExerciseUiState.initial();
    state = AsyncData(currentUiState.copyWith(isFormSelectionMode: enabled));
  }
}
```

### Example 5: ViewModel Provider (Presentation Layer)

```dart
// Presentation layer - ViewModel provider
@riverpod
class ExerciseScreenState extends _$ExerciseScreenState {
  @override
  AsyncValue<ExerciseScreenViewModel> build() {
    // Watch both UI state and data state
    final controllerState = ref.watch(grammarExercisesControllerProvider);
    final dataState = ref.watch(grammarExercisesDataProvider);
    
    // Handle loading/error states
    if (controllerState is AsyncLoading || dataState is AsyncLoading) {
      return const AsyncLoading();
    }
    
    if (controllerState is AsyncError) {
      return AsyncError(controllerState.error, controllerState.stackTrace);
    }
    
    if (dataState is AsyncError) {
      return AsyncError(dataState.error, dataState.stackTrace);
    }
    
    // Combine states into a view model
    final uiState = controllerState.value!;
    final exercises = dataState.value!.exercises;
    final currentIndex = dataState.value!.currentIndex;
    
    return AsyncData(ExerciseScreenViewModel(
      uiState: uiState,
      currentExercise: exercises.isNotEmpty && currentIndex < exercises.length 
          ? exercises[currentIndex] 
          : null,
      progress: ExerciseProgress(
        totalExercises: exercises.length,
        completedExercises: dataState.value!.completedExerciseIndices.length,
        currentIndex: currentIndex,
      ),
    ));
  }
}

// View model class
class ExerciseScreenViewModel {
  final GrammarExerciseUiState uiState;
  final GrammarExercise? currentExercise;
  final ExerciseProgress progress;
  
  ExerciseScreenViewModel({
    required this.uiState,
    required this.currentExercise,
    required this.progress,
  });
  
  // Derived properties for UI
  bool get isFormSelectionMode => uiState.isFormSelectionMode;
  bool get isSessionCompleted => uiState.isSessionCompleted;
  bool get hasExercise => currentExercise != null;
  double get progressPercentage => 
      progress.totalExercises > 0 ? progress.completedExercises / progress.totalExercises : 0.0;
}
```

### Example 6: Widget Using ViewModel (Presentation Layer)

```dart
// Presentation layer - widget using ViewModel
class GrammarExercisesScreen extends ConsumerWidget {
  const GrammarExercisesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Use the ViewModel provider instead of watching multiple providers
    final screenState = ref.watch(exerciseScreenStateProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Grammar Exercises')),
      body: screenState.when(
        data: (viewModel) {
          // Clear conditional UI rendering using view model properties
          if (viewModel.isFormSelectionMode) {
            return FormSelector(
              onFormSelected: (languageCode, formKeys) {
                ref.read(grammarExercisesControllerProvider.notifier)
                  .startExerciseSession(
                    languageCode: languageCode,
                    formKeys: formKeys,
                  );
              },
            );
          } else if (viewModel.isSessionCompleted) {
            return ExerciseResultsScreen(
              progress: viewModel.progress,
            );
          } else if (viewModel.hasExercise) {
            return ExerciseView(
              exercise: viewModel.currentExercise!,
              progress: viewModel.progressPercentage,
            );
          } else {
            return const EmptyStateView();
          }
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: ${error.toString()}'),
        ),
      ),
    );
  }
}
```

## Conclusion

The Flutter Riverpod Clean Architecture pattern combines the principles of clean architecture with the power of Riverpod's state management. It enables building maintainable, testable, and scalable applications by separating concerns into distinct layers, each with clear responsibilities and boundaries.

This approach:
- Maintains separation of concerns
- Enables effective testing at all layers
- Provides a clear data flow
- Leverages Riverpod's capabilities
- Scales well for complex applications

By following these patterns and practices, you can build Flutter applications that are easier to maintain, test, and extend over time.