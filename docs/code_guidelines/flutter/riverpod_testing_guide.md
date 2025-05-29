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

3. **⛔️ NEVER USE DEPRECATED OVERRIDE METHODS**
   - ✅ DO: Use `.overrideWith((_) => mockImpl)` for all overrides
   - ❌ DON'T: Use deprecated `.overrideWithValue()` anywhere

## 🔑 MANDATORY TESTING STRUCTURE

1. **▶️ ALWAYS Use `runAsync` for Widget Tests With Providers**

   ```dart
   testWidgets('provider test', (tester) async {
     await tester.runAsync(() async {
       // All test code goes inside this block
     });
   });
   ```

2. **▶️ ALWAYS Get Container From Widget Tree**
   - ✅ DO: `final container = getContainerFromWidget(tester, MyWidget);`
   - ❌ DON'T: Create standalone containers or access providers without the container

### Implementation of getContainerFromWidget

**IMPORTANT**: Either find `getContainerFromWidget` in your codebase or create this helper function. Do NOT use the raw implementation directly in your tests.

```dart
// Create this helper function in your test utilities
ProviderContainer getContainerFromWidget(WidgetTester tester, Type widgetType) {
  final element = tester.element(find.byType(widgetType));
  return ProviderScope.containerOf(element);
}

// Complete example usage
void main() {
  testWidgets('provider test example', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: YourWidgetYouWantToTest()),
    );

    // ✅ DO: Use the helper function
    final container = getContainerFromWidget(tester, YourWidgetYouWantToTest);

    // Now interact with your providers
    expect(
      container.read(provider),
      'some value',
    );
  });
}
```

## Test Setup & Workflow

### Setup Rules

```dart
setUpAll(() {
  AsyncValueHelper.registerFallbackValues();
  registerFallbackValue(FakeMyModel());
});

setUp(() {
  mockRepository = MockRepository();
  when(() => mockService.getData()).thenAnswer((_) async => ['data']);
});
```

### AsyncValueHelper Implementation

**IMPORTANT**: Either find `AsyncValueHelper` in your codebase or create this helper class for registering AsyncValue fallback values in tests.

```dart
// Create this helper class in your test utilities
class AsyncValueHelper {
  static void registerFallbackValues() {
    // Register fallback values for all AsyncValue states
    registerFallbackValue(const AsyncLoading<dynamic>());
    registerFallbackValue(const AsyncData<dynamic>(null));
    registerFallbackValue(AsyncError<dynamic>(Exception('test'), StackTrace.empty));
    
    // Register common generic types you use in your app
    registerFallbackValue(const AsyncLoading<String>());
    registerFallbackValue(const AsyncData<String>(''));
    registerFallbackValue(AsyncError<String>(Exception('test'), StackTrace.empty));
    
    registerFallbackValue(const AsyncLoading<List<dynamic>>());
    registerFallbackValue(const AsyncData<List<dynamic>>([]));
    registerFallbackValue(AsyncError<List<dynamic>>(Exception('test'), StackTrace.empty));
    
    // Add more specific types as needed for your domain models
    // registerFallbackValue(const AsyncLoading<User>());
    // registerFallbackValue(AsyncData<User>(User.empty()));
    // registerFallbackValue(AsyncError<User>(Exception('test'), StackTrace.empty));
  }
}
```

### Listen → Act → Pump → Assert Pattern

```dart
await tester.runAsync(() async {
  // Build widget with overrides
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        serviceProvider.overrideWith((_) => mockService), // ONLY override dependencies
      ],
      child: const MyWidget(),
    ),
  );
  
  final container = getContainerFromWidget(tester, MyWidget);
  
  // LISTEN: Set up state listener BEFORE actions
  final listener = Listener<AsyncValue<MyState>>();
  container.listen(myControllerProvider, listener.call, fireImmediately: true);
  
  // ACT: Trigger provider actions
  container.read(myControllerProvider.notifier).performAction();
  
  // PUMP: Process async operations strategically
  await container.pump();  // Process provider async operations
  await tester.pump();     // Update the UI with new state
  
  // ASSERT: Verify state transitions and UI
  verifyInOrder([
    () => listener(null, any(that: isA<AsyncLoading<MyState>>())),
    () => listener(any(), any(that: isA<AsyncData<MyState>>())),
  ]);
  expect(find.text('Expected UI'), findsOneWidget);
});
```

## Testing Patterns by Provider Type

### Classic Providers (StateNotifier)

```dart
testWidgets('classic provider handles state changes', (tester) async {
  await tester.runAsync(() async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [repositoryProvider.overrideWith((_) => mockRepository)],
        child: const MyWidget(),
      ),
    );
    
    final container = getContainerFromWidget(tester, MyWidget);
    final listener = Listener<AsyncValue<MyState>>();
    container.listen(myControllerProvider, listener.call, fireImmediately: true);
    
    // Trigger action through notifier method (never set state directly)
    container.read(myControllerProvider.notifier).loadData();
    
    await container.pump();
    await tester.pump();
    
    verify(() => mockRepository.getData()).called(1);
    expect(find.text('Loaded Data'), findsOneWidget);
  });
});
```

### Code-Generated Providers (@riverpod)

```dart
@riverpod
class TodoList extends _$TodoList {
  @override
  Future<List<Todo>> build() async {
    return ref.watch(todoRepositoryProvider).getAllTodos();
  }
  
  Future<void> addTodo(String title) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final newTodo = await ref.read(todoRepositoryProvider).addTodo(title);
      final currentList = await future;
      return [...currentList, newTodo];
    });
  }
}

testWidgets('generated provider handles operations correctly', (tester) async {
  await tester.runAsync(() async {
    when(() => mockTodoRepository.getAllTodos())
        .thenAnswer((_) async => [Todo(id: '1', title: 'Existing')]);
    when(() => mockTodoRepository.addTodo('New'))
        .thenAnswer((_) async => Todo(id: '2', title: 'New'));
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [todoRepositoryProvider.overrideWith((_) => mockTodoRepository)],
        child: const TodoListWidget(),
      ),
    );
    
    final container = getContainerFromWidget(tester, TodoListWidget);
    final listener = Listener<AsyncValue<List<Todo>>>();
    container.listen(todoListProvider, listener.call, fireImmediately: true);
    
    await container.pump();
    await tester.pump();
    
    await container.read(todoListProvider.notifier).addTodo('New');
    await container.pump();
    await tester.pump();
    
    final finalState = container.read(todoListProvider);
    expect(finalState.valueOrNull?.length, equals(2));
  });
});
```

### Family Providers

```dart
@riverpod
Future<User> user(UserRef ref, String userId) async {
  return ref.watch(userRepositoryProvider).getUser(userId);
}

testWidgets('family provider handles different parameters', (tester) async {
  await tester.runAsync(() async {
    when(() => mockUserRepository.getUser('user1'))
        .thenAnswer((_) async => User(id: 'user1', name: 'Alice'));
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [userRepositoryProvider.overrideWith((_) => mockUserRepository)],
        child: const UserProfileWidget(userId: 'user1'),
      ),
    );
    
    final container = getContainerFromWidget(tester, UserProfileWidget);
    
    await container.pump();
    await tester.pump();
    
    expect(find.text('Alice'), findsOneWidget);
    
    // Verify different family instances are independent
    final user2State = container.read(userProvider('user2'));
    expect(user2State, isA<AsyncLoading<User>>());
    verifyNever(() => mockUserRepository.getUser('user2'));
  });
});
```

## Advanced Testing Scenarios

### Provider Dependencies & Invalidation

```dart
testWidgets('provider dependencies and invalidation work correctly', (tester) async {
  await tester.runAsync(() async {
    var callCount = 0;
    when(() => mockDataService.fetchData()).thenAnswer((_) async {
      callCount++;
      return 'Data $callCount';
    });
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [dataServiceProvider.overrideWith((_) => mockDataService)],
        child: const DataWidget(),
      ),
    );
    
    final container = getContainerFromWidget(tester, DataWidget);
    
    await container.pump();
    await tester.pump();
    expect(find.text('Data 1'), findsOneWidget);
    
    // Test invalidate
    container.invalidate(dataProvider);
    await container.pump();
    await tester.pump();
    expect(find.text('Data 2'), findsOneWidget);
    
    // Test refresh
    await container.refresh(dataProvider);
    await container.pump();
    await tester.pump();
    expect(find.text('Data 3'), findsOneWidget);
    
    verify(() => mockDataService.fetchData()).called(3);
  });
});
```

### Error Recovery & Retry

```dart
testWidgets('provider handles error recovery correctly', (tester) async {
  await tester.runAsync(() async {
    when(() => mockDataService.fetchData())
        .thenThrow(Exception('Network error'))
        .thenAnswer((_) async => 'Success data');
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [dataServiceProvider.overrideWith((_) => mockDataService)],
        child: const ResilientDataWidget(),
      ),
    );
    
    final container = getContainerFromWidget(tester, ResilientDataWidget);
    final listener = Listener<AsyncValue<String>>();
    container.listen(resilientDataProvider, listener.call, fireImmediately: true);
    
    // Initial load fails
    await container.pump();
    await tester.pump();
    expect(find.text('Error: Network error'), findsOneWidget);
    
    // Retry and succeed
    await container.read(resilientDataProvider.notifier).retry();
    await container.pump();
    await tester.pump();
    expect(find.text('Success data'), findsOneWidget);
    
    // Verify state transitions: loading -> error -> loading -> success
    verifyInOrder([
      () => listener(null, any(that: isA<AsyncLoading<String>>())),
      () => listener(any(), any(that: isA<AsyncError<String>>())),
      () => listener(any(), any(that: isA<AsyncLoading<String>>())),
      () => listener(any(), any(that: isA<AsyncData<String>>())),
    ]);
  });
});
```

### keepAlive() Lifecycle Testing

```dart
testWidgets('keepAlive prevents provider disposal', (tester) async {
  await tester.runAsync(() async {
    var computeCallCount = 0;
    when(() => mockExpensiveService.computeExpensiveData()).thenAnswer((_) async {
      computeCallCount++;
      return ExpensiveData(value: computeCallCount);
    });
    
    await tester.pumpWidget(
      ProviderScope(
        overrides: [expensiveServiceProvider.overrideWith((_) => mockExpensiveService)],
        child: const ConditionalDataWidget(showData: true),
      ),
    );
    
    final container = getContainerFromWidget(tester, ConditionalDataWidget);
    
    await container.pump();
    await tester.pump();
    expect(computeCallCount, equals(1));
    
    // Hide widget (would normally dispose provider)
    await tester.pumpWidget(
      ProviderScope(
        overrides: [expensiveServiceProvider.overrideWith((_) => mockExpensiveService)],
        child: const ConditionalDataWidget(showData: false),
      ),
    );
    await tester.pump();
    
    // Show widget again - with keepAlive, computation should not run again
    await tester.pumpWidget(
      ProviderScope(
        overrides: [expensiveServiceProvider.overrideWith((_) => mockExpensiveService)],
        child: const ConditionalDataWidget(showData: true),
      ),
    );
    await tester.pump();
    
    expect(computeCallCount, equals(1)); // Still only called once
  });
});
```

## 📋 Complete Testing Checklist

### Core Requirements

✅ Using `runAsync` for all widget tests with providers  
✅ Getting container from widget tree with `getContainerFromWidget`  
✅ Using `.overrideWith()` for all provider overrides  
✅ Testing real provider implementations (never mocking class-based providers)  
✅ Never directly setting provider state (`.state = newState`)  
✅ Following Listen → Act → Pump → Assert pattern  
✅ Setting up listeners before actions  
✅ Using strategic pump sequences to handle async operations  

### Verification Requirements

✅ Verifying both state transitions and UI updates  
✅ Testing loading, success, and error flows  
✅ Verifying interactions with dependencies  

### Modern Riverpod Features

✅ Testing code-generated providers with `@riverpod`  
✅ Testing family providers with different parameters  
✅ Testing provider dependencies and `ref.watch()` relationships  
✅ Testing `ref.invalidate()` and `ref.refresh()` behavior  
✅ Testing `keepAlive()` provider lifecycle  
✅ Testing error recovery and retry patterns  

By following these comprehensive rules, you'll ensure thorough testing of both classic and modern Riverpod providers in Flutter applications with a focus on both state management and UI behavior.
