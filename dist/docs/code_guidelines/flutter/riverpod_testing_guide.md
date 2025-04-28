# RIVERPOD TESTING RULEBOOK: DEFINITIVE GUIDE

## ⚠️ CRITICAL RULES - NEVER BREAK THESE ⚠️

1. **⛔️ NEVER MOCK CLASS-BASED PROVIDERS**
   - This completely invalidates your tests!
   - ✅ DO: Test actual provider implementations with their real business logic
   - ❌ DON'T: Mock controllers, notifiers, or any provider with a `build()` method

2. **⛔️ NEVER DIRECTLY SET PROVIDER STATE**
   - This bypasses all business logic and breaks encapsulation!
   - ✅ DO: Call public methods on the provider notifier to change state
   - ❌ DON'T: Directly set provider state with `.state = newState`
   - Example of what NOT to do:
     ```dart
     // WRONG - Never do this
     container.read(myProvider.notifier).state = AsyncData(newState);
     ```

3. **⛔️ NEVER USE DEPRECATED OVERRIDE METHODS**
   - ✅ DO: Use `.overrideWith((_) => mockImpl)` for all overrides
   - ❌ DON'T: Use deprecated `.overrideWithValue()` anywhere

## 🔑 MANDATORY TESTING STRUCTURE

1. **▶️ ALWAYS Use `runAsync` for Widget Tests With Providers**
   ```dart
   testWidgets('provider test', (tester) async {
     await tester.runAsync(() async {
       // All test code goes inside this block
       // Setup, actions, and assertions
     });
   });
   ```

2. **▶️ ALWAYS Get Container From Widget Tree**
   - ✅ DO: `final container = getContainerFromWidget(tester, MyWidget);`
   - ❌ DON'T: Create standalone containers or access providers without the container

## Test Setup Rules

1. **Register Fallback Values in `setUpAll`**
   ```dart
   setUpAll(() {
     AsyncValueHelper.registerFallbackValues();
     registerFallbackValue(FakeMyModel());
   });
   ```

2. **Initialize Mocks in `setUp`**
   ```dart
   setUp(() {
     mockRepository = MockRepository();
     mockService = MockService();
     
     // Configure mock default responses
     when(() => mockService.getData()).thenAnswer((_) async => ['data']);
   });
   ```

3. **Provider Override Hierarchy**
   ```dart
   await tester.pumpWidget(
     ProviderScope(
       overrides: [
         // ONLY override dependency providers
         repositoryProvider.overrideWith((_) => mockRepository),
         serviceProvider.overrideWith((_) => mockService),
       ],
       child: const MyWidget(),
     ),
   );
   ```

## Async Testing Workflow

1. **Test Flow: Listen → Act → Pump → Assert**
   - Listen: Set up state listeners before any actions
   - Act: Perform actions that trigger state changes
   - Pump: Handle async operations with strategic pumps
   - Assert: Verify state and UI after changes complete

2. **Set Up Listeners First**
   ```dart
   final container = getContainerFromWidget(tester, MyWidget);
   
   // Always register listeners before actions
   final listener = Listener<AsyncValue<MyState>>();
   container.listen(
     myControllerProvider,
     listener.call,
     fireImmediately: true,
   );
   ```

3. **Strategic Pump Sequence**
   ```dart
   // After triggering provider actions
   await container.pump();  // Process provider async operations
   await tester.pump();     // Update the UI with new state
   await tester.pumpAndSettle();  // Handle animations (if needed)
   ```

## Verification Rules

1. **Verify State Transitions**
   ```dart
   // Verify expected state sequence
   verifyInOrder([
     // Initial loading state
     () => listener(null, any(that: isA<AsyncLoading<MyState>>())),
     
     // Final data state 
     () => listener(
       any(that: isA<AsyncLoading<MyState>>()),
       any(that: isA<AsyncData<MyState>>()),
     ),
   ]);
   ```

2. **Verify UI State Matches Provider State**
   ```dart
   // Verify provider state
   final state = container.read(myControllerProvider);
   expect(state.valueOrNull?.someProperty, equals(expectedValue));
   
   // Verify matching UI state
   expect(find.text(expectedValue.toString()), findsOneWidget);
   ```

3. **Verify Dependency Interactions**
   ```dart
   // Verify service method was called correctly
   verify(() => mockService.getData(param: 'value')).called(1);
   ```

## Complete Example Templates

### 1. Testing Loading/Success/Error Flow

```dart
testWidgets('loads data, handles success and errors correctly', (tester) async {
  await tester.runAsync(() async {
    // Configure mock response
    when(() => mockService.getData())
      .thenAnswer((_) async => ['data']);
    
    // Build widget
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          serviceProvider.overrideWith((_) => mockService),
        ],
        child: const MyWidget(),
      ),
    );
    
    // Get container from widget
    final container = getContainerFromWidget(tester, MyWidget);
    
    // LISTEN: Set up state listener
    final listener = Listener<AsyncValue<MyState>>();
    container.listen(
      myControllerProvider,
      listener.call,
      fireImmediately: true,
    );
    
    // Initial loading state verification
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    // PUMP: Process async operations
    await container.pump();
    await tester.pump();
    
    // SUCCESS STATE: Verify UI shows data
    expect(find.text('data'), findsOneWidget);
    
    // Verify state transitions
    verify(() => listener(null, any(that: isA<AsyncLoading<MyState>>()))).called(1);
    verify(() => listener(
      any(that: isA<AsyncLoading<MyState>>()),
      any(that: isA<AsyncData<MyState>>()),
    )).called(1);
    
    // TEST ERROR FLOW: Change mock to throw error
    reset(mockService);
    when(() => mockService.getData())
      .thenThrow(Exception('Test error'));
    
    // Trigger reload
    container.read(myControllerProvider.notifier).reload();
    
    // PUMP: Process async operations for error case
    await container.pump();
    await tester.pump();
    
    // Verify error UI
    expect(find.text('Error: Test error'), findsOneWidget);
    
    // Verify error state transition
    verify(() => listener(
      any(that: isA<AsyncData<MyState>>()),
      any(that: isA<AsyncError<MyState>>()),
    )).called(1);
  });
});
```

### 2. Testing User Interactions

```dart
testWidgets('user interactions trigger correct provider methods', (tester) async {
  await tester.runAsync(() async {
    // Build widget
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          repositoryProvider.overrideWith((_) => mockRepository),
        ],
        child: const MyInteractiveWidget(),
      ),
    );
    
    // Get container from widget
    final container = getContainerFromWidget(tester, MyInteractiveWidget);
    
    // LISTEN: Set up listener for controller
    final listener = Listener<AsyncValue<MyState>>();
    container.listen(
      myControllerProvider,
      listener.call,
      fireImmediately: true,
    );
    
    // Verify initial state
    expect(find.text('Initial State'), findsOneWidget);
    
    // ACT: Trigger user interaction
    await tester.tap(find.byType(ElevatedButton));
    
    // PUMP: Update UI
    await tester.pump();
    await container.pump();
    await tester.pump();
    
    // Verify controller method was called
    verify(() => mockRepository.saveItem(any())).called(1);
    
    // Verify state changed after user action
    verify(() => listener(
      any(that: isA<AsyncData<MyState>>()),
      any(that: isA<AsyncData<MyState>>()),
    )).called(1);
    
    // Verify UI updated
    expect(find.text('Updated State'), findsOneWidget);
  });
});
```

## Special Testing Scenarios

### 1. Testing Provider Initialization

```dart
testWidgets('provider initializes with correct default state', (tester) async {
  await tester.runAsync(() async {
    // Build widget
    await tester.pumpWidget(
      const ProviderScope(
        child: MyWidget(),
      ),
    );
    
    // Get container and initial state
    final container = getContainerFromWidget(tester, MyWidget);
    final initialState = container.read(myControllerProvider);
    
    // Verify initial state properties
    expect(initialState.valueOrNull?.property, equals(defaultValue));
    expect(find.text('Default Text'), findsOneWidget);
  });
});
```

### 2. Testing Provider Side Effects

```dart
testWidgets('provider actions trigger appropriate side effects', (tester) async {
  await tester.runAsync(() async {
    // Build widget with router mock for navigation testing
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          serviceProvider.overrideWith((_) => mockService),
        ],
        child: MockGoRouterProvider(
          goRouter: mockRouter,
          child: const MyWidget(),
        ),
      ),
    );
    
    // Get container
    final container = getContainerFromWidget(tester, MyWidget);
    
    // Trigger action with side effect
    container.read(myControllerProvider.notifier).completeAction();
    
    // Process async operations
    await container.pump();
    await tester.pump();
    
    // Verify side effects occurred
    verify(() => mockRouter.push('/next-screen')).called(1);
    verify(() => mockService.logCompletion()).called(1);
  });
});
```

## 📋 Final Testing Checklist

✅ Using `runAsync` for all widget tests with providers  
✅ Getting container from widget tree with `getContainerFromWidget`  
✅ Using `.overrideWith()` for all provider overrides  
✅ Testing real provider implementations (never mocking class-based providers)  
✅ Never directly setting provider state (`.state = newState`)  
✅ Following Listen → Act → Pump → Assert pattern  
✅ Setting up listeners before actions  
✅ Using strategic pump sequences to handle async operations  
✅ Verifying both state transitions and UI updates  
✅ Testing loading, success, and error flows  
✅ Verifying interactions with dependencies  

By following these rules consistently, you'll ensure thorough testing of Riverpod providers in Flutter applications with a focus on both state management and UI behavior.