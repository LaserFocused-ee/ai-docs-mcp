# Flutter/Dart Best Practices

This guide outlines the best practices for developing Flutter applications with Dart, focusing on architecture, state management, and code organization.

## Project Structure

- Organize code by feature rather than by type
- Use a layered architecture (presentation, domain, data)
- Keep UI components separate from business logic
- Use consistent file naming conventions (snake_case for files, PascalCase for classes)
- Group related components in dedicated directories
- Place reusable widgets in a shared/common directory
- Implement barrel files (index.dart) for cleaner imports
- Use relative imports for files within the same feature module

## Riverpod Standards

When working with Riverpod in Flutter/Dart projects, always use the modern code-generation approach:

- Use `@riverpod` annotations instead of manual providers
- Avoid outdated `StateNotifierProvider` in favor of class-based annotated providers
- Use functional providers (`@riverpod methodName(Ref)`) for simple read-only state
- Use class-based providers (`@riverpod class MyClass extends _$MyClass`) for state with methods
- Use build_runner for code generation
- Keep provider logic focused and specific to a single responsibility
- Organize providers in dedicated files by feature

## Widget Best Practices

- Prefer Stateless widgets when possible
- Keep widget tree depth reasonable (avoid deeply nested widgets)
- Extract complex widget trees into smaller, reusable widgets
- Use const constructors when applicable for performance
- Leverage keys appropriately for widget identity
- Use proper widget composition rather than conditional logic when possible
- Implement custom widgets for reusable UI patterns
- Consider using Builder widgets for context-specific operations
- Use SliverList/SliverGrid for better scrolling performance
- Avoid expensive computations during build method
- Implement proper error handling and loading states

## State Management Architecture

- Use Riverpod as the primary state management solution
- Separate UI state from application state
- Implement Repository pattern for data access
- Use service classes for business logic
- Implement proper dependency injection with Riverpod
- Split state into logical, focused providers
- Use immutable state objects with copyWith methods
- Handle loading/error states consistently across the app
- Avoid global state when possible
- Implement caching strategies for expensive operations
- Consider using AsyncValue for all async operations

## Performance Considerations

- Use the DevTools Performance tab to identify bottlenecks
- Implement pagination for large lists
- Use cached_network_image for image caching
- Leverage const constructors for static widgets
- Use ListView.builder or ListView.separated for dynamic lists
- Implement proper key usage for widget reconciliation
- Avoid expensive operations in build methods
- Use compute for CPU-intensive operations
- Implement proper image sizing and compression
- Use SliverAppBar and SliverList for better scroll performance
- Consider using RepaintBoundary for complex UI sections
- Optimize animations for smooth performance

## Testing Approaches

- Implement widget tests for UI components
- Write unit tests for business logic and models
- Use integration tests for critical user flows
- Mock external dependencies for testing
- Use golden tests for UI regression testing
- Implement test helpers and fixtures for common testing patterns
- Test error cases and edge conditions
- Use data builders for test data generation
- Implement proper test coverage for critical code paths
- Separate test files by feature and test type
- Use test groups to organize related tests