# Flutter/Dart Best Practices

This guide outlines essential best practices for developing Flutter applications with Dart, focusing on architecture, state management, testing, and code organization.

## Architecture & Project Structure

### Clean Architecture Implementation

- **Follow Clean Architecture principles** with clear layer separation
- **Use feature-first organization** rather than type-based structure
- **Implement dependency inversion** with interfaces at layer boundaries
- **Maintain unidirectional data flow**: repositories → services → controllers → UI

**Reference**: See `docs://code_guidelines/flutter/architecture/flutter_riverpod_clean_architecture` for complete implementation guide.

### Directory Structure

```
/features
  /feature_name
    /application    # Services, state providers
    /data          # Repositories, APIs, DTOs
    /domain        # Entities, repository interfaces
    /presentation  # Controllers, UI, widgets
```

### File Organization

- Use **snake_case** for files, **PascalCase** for classes
- Implement **barrel files** (index.dart) for cleaner imports
- Use **relative imports** within feature modules
- Place **reusable widgets** in shared/common directories

## Riverpod State Management

### Modern Riverpod Patterns

- **ALWAYS use `@riverpod` annotations** (never manual providers)
- **Use code generation** with build_runner
- **Functional providers** for simple read-only state: `@riverpod methodName(Ref)`
- **Class-based providers** for stateful operations: `@riverpod class MyClass extends _$MyClass`

### Provider Types & Usage

- **Repository Providers**: Connect domain interfaces to data implementations
- **Data Providers**: Source of truth for application state (`keepAlive: true`)
- **Service Providers**: Orchestrate complex business operations
- **Controller Providers**: Manage UI-specific state and user interactions
- **ViewModel Providers**: Combine multiple states for complex UI consumption

### State Management Rules

- **Separate UI state from data state** completely
- **Use AsyncValue** for all async operations (loading/error/data states)
- **Implement immutable state objects** with copyWith methods
- **Avoid global state** - prefer scoped providers
- **Use ViewModel providers** to avoid nested AsyncValue handling

**Reference**: See `docs://code_guidelines/flutter/architecture/flutter_riverpod_clean_architecture` for detailed patterns.

## Widget & UI Best Practices

### Widget Design

- **Prefer StatelessWidget** when possible
- **NEVER use StatefulWidget** in feature code (only for design system atoms/molecules)
- **Use ConsumerWidget** with providers instead of local state
- **Extract complex widgets** into smaller, reusable components
- **Use const constructors** for performance optimization

### Performance Optimization

- **Avoid expensive computations** in build methods
- **Use ListView.builder** for dynamic lists
- **Implement proper key usage** for widget reconciliation
- **Use RepaintBoundary** for complex UI sections
- **Leverage SliverList/SliverGrid** for better scrolling performance

### UI State Management

- **All state should be managed by controllers and providers**
- **Extract animation controllers** to dedicated provider classes
- **Implement proper error handling** and loading states
- **Use Builder widgets** for context-specific operations

## Testing Standards

### Critical Testing Rules

- **NEVER mock class-based providers** (invalidates tests completely)
- **NEVER directly set provider state** (bypasses business logic)
- **ALWAYS use `.overrideWith((_) => mockImpl)`** for overrides
- **ALWAYS use `runAsync`** for widget tests with providers
- **ALWAYS get container from widget tree** using `getContainerFromWidget`

### Testing Workflow

- **Follow Listen → Act → Pump → Assert pattern**
- **Set up listeners BEFORE actions**
- **Use strategic pump sequences** for async operations
- **Test real provider implementations** with mocked dependencies only

### Test Organization

- **Domain Layer**: Pure unit tests, no framework dependencies
- **Data Layer**: Test repositories with mocked data sources
- **Application Layer**: Test services with mocked repositories
- **Presentation Layer**: Test controllers with mocked services, widget tests for UI
- **Integration Tests**: End-to-end feature functionality

**Reference**: See `docs://code_guidelines/flutter/riverpod_testing_guide` for comprehensive testing patterns and examples.

## Code Quality & Standards

### Dart Language Best Practices

- **Use Freezed** for immutable data classes and unions
- **Implement proper null safety** patterns
- **Use meaningful variable and function names**
- **Follow Dart style guide** for formatting and conventions
- **Implement proper error handling** with custom exceptions

### Dependency Management

- **Use dependency injection** through constructors or Riverpod
- **Abstract external dependencies** behind interfaces
- **Avoid singletons and global state**
- **Implement proper service locator patterns**

### Performance Considerations

- **Use DevTools Performance tab** to identify bottlenecks
- **Implement pagination** for large datasets
- **Use cached_network_image** for image optimization
- **Use compute** for CPU-intensive operations
- **Implement proper caching strategies** for expensive operations

## Development Workflow

### Code Generation

- **Run build_runner** for Riverpod code generation
- **Use freezed** for data classes and sealed unions
- **Implement json_annotation** for serialization
- **Keep generated files** in version control

### Testing Workflow

- **Write tests first** for critical business logic
- **Use test helpers** like `AsyncValueHelper.registerFallbackValues()`
- **Implement golden tests** for UI regression testing
- **Test error cases** and edge conditions thoroughly

### Documentation

- **Document complex business logic** and architectural decisions
- **Use meaningful commit messages** following conventional commits
- **Maintain README files** for feature modules
- **Document API contracts** and data models

## Common Anti-Patterns to Avoid

### State Management Anti-Patterns

- ❌ **Using StatefulWidget** for feature screens
- ❌ **Mocking class-based providers** in tests
- ❌ **Setting provider state directly** (`.state = newValue`)
- ❌ **Using deprecated provider methods** (`.overrideWithValue()`)
- ❌ **Nested AsyncValue handling** (`.when()` inside `.when()`)

### Architecture Anti-Patterns

- ❌ **Mixing domain logic with UI code**
- ❌ **Accessing repositories directly from UI**
- ❌ **Creating circular dependencies** between layers
- ❌ **Using global state** for feature-specific data

### Testing Anti-Patterns

- ❌ **Testing implementation details** instead of behavior
- ❌ **Creating standalone containers** in tests
- ❌ **Skipping async operation handling** in widget tests
- ❌ **Not testing error scenarios**

## Quick Reference Checklist

### Before Code Review

- [ ] Following Clean Architecture layer separation
- [ ] Using modern Riverpod patterns with `@riverpod`
- [ ] No StatefulWidget in feature code
- [ ] Proper test coverage with correct patterns
- [ ] No anti-patterns present
- [ ] Performance considerations addressed

### For New Features

- [ ] Domain entities and repository interfaces defined
- [ ] Data layer implements domain contracts
- [ ] Services coordinate business operations
- [ ] Controllers manage UI state only
- [ ] Comprehensive tests at each layer
- [ ] Error handling implemented

**References**:

- Architecture: `docs://code_guidelines/flutter/architecture/flutter_riverpod_clean_architecture`
- Testing: `docs://code_guidelines/flutter/riverpod_testing_guide`
