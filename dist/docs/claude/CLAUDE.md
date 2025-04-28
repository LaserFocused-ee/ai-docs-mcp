Base# Personal Preferences [REFERENCE: Global development standards]

This document contains standardized practices and patterns for both frontend and backend development.

# GENERAL GUIDELINES [REFERENCE: Cross-cutting concerns for all development]

## Structured Planning [PATTERNS: planning-mode, feature-planning, system-design]

### Planning Principles [REFERENCE: Planning methodology]

- Always plan features and systems before beginning implementation
- Prioritize understanding the problem space thoroughly before proposing solutions
- Break down complex problems into clear vertical slices (end-to-end functionality)
- Focus on MVP (Minimum Viable Product) approach first, then iterate
- Document all planning artifacts for future reference and communication
- Validate technical feasibility during planning rather than during implementation

### Planning Process [PATTERNS: planning-stages, feature-documentation]

1. **Problem Definition**
   - Clearly articulate the problem being solved
   - Identify stakeholders and their needs
   - Define success criteria and constraints
   - Document acceptance criteria

2. **Solution Architecture**
   - Identify system components and their relationships
   - Design data models and interfaces
   - Select appropriate technologies and patterns
   - Consider security, performance, and scalability requirements

3. **Implementation Strategy**
   - Break down work into logical vertical slices
   - Prioritize tasks based on dependencies and value
   - Identify technical risks and mitigations
   - Establish testing strategy

4. **Documentation**
   - Create technical specifications
   - Document API contracts and interfaces
   - Diagram system architecture and data flows
   - Create development plan with clear tasks

### Vertical Slicing [REFERENCE: Agile implementation]

- Prioritize delivering thin, end-to-end slices of functionality
- Ensure each slice delivers tangible user value
- Design slices to validate technical assumptions early
- Structure slices to enable incremental testing
- Balance slice size to enable frequent integration

### Scope Management [PATTERNS: mvp-focus, feature-prioritization]

- Ruthlessly prioritize features based on core value proposition
- Differentiate between "must have," "should have," and "nice to have" requirements
- Explicitly document what's excluded from initial scope
- Establish clear criteria for future iterations
- Focus on solving the most critical aspects of the problem first

## Git Workflow with Graphite [PATTERNS: git-workflow, code-management, version-control, graphite-stacks]

- Use Graphite for managing branch stacks and pull requests
- Create stacked branches for related tasks using `gt create`
- Submit PRs with `gt submit` and stack PRs with `gt submit --stack`
- Maintain branch stacks with `gt restack` when necessary
- Check the detailed reference at `/Users/justinclapperton/code/personal/ai-docs/code_guidelines/git/graphite_commands_reference.md`

### Commit Guidelines [PATTERNS: commit-strategy, git-history]

- Commit code changes frequently rather than creating large, monolithic commits
- Use small, focused commits with clear descriptions that explain the purpose (not just what was changed)
- Commit after each logical unit of work is completed and tested
- Never leave code uncommitted at the end of a work session
- Modify commits with `gt modify` to maintain clean history
- Submit PRs with `gt submit` to create or update PRs on GitHub
- Maintain a clean git history that tells a clear story of development

## Code Guidelines & Architecture Documentation [PATTERNS: code-guidelines, architecture-docs]

- Code guidelines are available in `/code/personal/ai-docs/code_guidelines/`
- Architecture patterns are technology-specific and documented for each platform:
  - Flutter/Dart: `/code/personal/ai-docs/code_guidelines/flutter/`
  - React/TypeScript: `/code/personal/ai-docs/code_guidelines/react/`
  - NestJS/Node.js: `/code/personal/ai-docs/code_guidelines/nestjs/`
- Testing guides are available for each technology
- ALWAYS consult these guidelines before implementing new features

## External Documentation Lookup [PATTERNS: context7, library-docs, API documentation]

- ALWAYS use the context7 tool to look up official documentation before working with any external libraries, APIs, or services
- First use `resolve-library-id` to get the exact library ID, then use `get-library-docs` to fetch documentation
- Documentation should be consulted before implementing or modifying code that interacts with external dependencies
- This ensures accurate, up-to-date implementation based on official documentation

---

# BACKEND DEVELOPMENT [REFERENCE: Server-side technologies, NestJS, TypeORM, Node.js]

## NestJS Best Practices [PATTERNS: *.module.ts, *.controller.ts, *.service.ts]

For detailed NestJS guidelines, see: `/code/personal/ai-docs/code_guidelines/nestjs/nestjs_best_practices.md`

### Critical NestJS Principles

- ⚠️ **Architecture Pattern**: Follow controller-service-repository pattern with clear responsibilities
- ⚠️ **TypeORM Configuration**: Never use `synchronize: true` in production environments
- ⚠️ **Database Migration**: Always use project-provided migration scripts, never manual SQL
- ⚠️ **Dependency Injection**: Use constructor-based DI with appropriate scopes

### Key Structural Guidelines

- Organize code by feature rather than technical role
- Keep controllers thin - they should only handle HTTP/request concerns
- Implement robust business logic in services
- Use repositories for data access abstraction 
- Apply DTOs for data validation and transformation
- Follow NestJS naming conventions: PascalCase for classes, camelCase for methods/properties

### Security Best Practices

- Apply proper security headers including helmet and CORS configuration
- Use Guards for route protection and role-based access control
- Implement JWT authentication with appropriate expiration and cookie settings
- Validate all input using pipes (especially ValidationPipe)
- Handle errors with appropriate filters and consistent responses

---

# FRONTEND DEVELOPMENT [REFERENCE: Client-side technologies, React, TypeScript]

## React Best Practices [PATTERNS: *.tsx, *.jsx, components/, hooks/]

For detailed React guidelines, see: `/code/personal/ai-docs/code_guidelines/react/react_best_practices.md`

### Critical React Principles

- ⚠️ **Component Structure**: Keep components small, focused, and functionally pure
- ⚠️ **Hook Rules**: Only call hooks at top level, never in conditions or loops
- ⚠️ **Dependencies**: Always provide complete dependency arrays to useEffect/useMemo
- ⚠️ **TypeScript**: Use proper typing for component props and state

### Key Architectural Guidelines

- Organize code by feature/domain rather than by type
- Extract reusable logic into custom hooks
- Use the Context API for data that needs to be accessed by many components
- Choose ONE state management solution - don't mix different libraries
- Separate UI components from container/business logic components
- Leverage React.memo only for expensive renders with simple props

### Styling Best Practices

- Use styled-components with dedicated style files
- Follow the project's theming system for colors, spacing, typography
- Create reusable style components for common patterns
- Use props for style variations rather than conditional classes

---

# MOBILE DEVELOPMENT [REFERENCE: Flutter, Dart, mobile app patterns]

## Flutter/Dart Best Practices [PATTERNS: *.dart, lib/, widgets/]

For detailed Flutter guidelines, see:
- Architecture: `/code/personal/ai-docs/code_guidelines/flutter/architecture/flutter_riverpod_clean_architecture.md`
- Best Practices: `/code/personal/ai-docs/code_guidelines/flutter/architecture/flutter_best_practices.md`

### Critical Flutter Principles

- ⚠️ **Widget Structure**: Keep widgets small, focused, and prefer composition over inheritance
- ⚠️ **Architecture**: Follow clean architecture with domain, data, application, and presentation layers
- ⚠️ **Performance**: Avoid expensive operations in build methods
- ⚠️ **Stateless First**: Use StatelessWidget when possible, NEVER use StatefulWidget in feature code
- ⚠️ **State Management**: Use Riverpod providers for all state, no local widget state

### Riverpod Standards [PATTERNS: @riverpod, build_runner, *.g.dart]

When working with Riverpod in Flutter/Dart projects, always use the modern code-generation approach:

- Use `@riverpod` annotations instead of manual providers
- Avoid outdated `StateNotifierProvider` in favor of class-based annotated providers
- Use functional providers (`@riverpod methodName(Ref)`) for simple read-only state
- Use class-based providers (`@riverpod class MyClass extends _$MyClass`) for state with methods
- Use build_runner for code generation

### Riverpod Testing Guidelines [REFERENCE: Widget testing, provider testing]

Follow these critical testing rules - for detailed guidelines, see `/code/personal/ai-docs/code_guidelines/flutter/riverpod_testing_guide.md`

- ⛔️ **NEVER MOCK CLASS-BASED PROVIDERS** - Test actual provider implementations with real business logic
- ⛔️ **NEVER DIRECTLY SET PROVIDER STATE** - Call public methods only, never `.state = newState`
- ⛔️ **NEVER USE DEPRECATED OVERRIDE METHODS** - Use `.overrideWith((_) => mockImpl)` not `.overrideWithValue()`
- ▶️ **ALWAYS USE `runAsync`** - Wrap provider tests with `tester.runAsync(() async {...})`
- ▶️ **ALWAYS GET CONTAINER FROM WIDGET** - Use `getContainerFromWidget(tester, MyWidget)`
- ▶️ **FOLLOW LISTEN→ACT→PUMP→ASSERT** - Set up listeners before actions, pump after actions

### Freezed for Data Models [PATTERNS: @freezed, *.freezed.dart, *.g.dart, json_serializable]

Use Freezed to create immutable data models with automatic implementations for common functionality:

- ⚠️ **Setup Requirements**:
  ```dart
  # Add dependencies
  flutter pub add freezed_annotation
  flutter pub add dev:build_runner
  flutter pub add dev:freezed
  # For JSON serialization:
  flutter pub add json_annotation
  flutter pub add dev:json_serializable
  
  # Disable linting warning for JSON annotations
  # In analysis_options.yaml:
  analyzer:
    errors:
      invalid_annotation_target: ignore
  ```

- ⚠️ **Basic Usage**: Create immutable models with automatic implementations
  ```dart
  import 'package:freezed_annotation/freezed_annotation.dart';
  
  part 'person.freezed.dart';
  part 'person.g.dart'; // Only if using JSON serialization
  
  @freezed
  class Person with _$Person {
    const factory Person({
      required String name,
      required int age,
    }) = _Person;
    
    factory Person.fromJson(Map<String, dynamic> json) => 
        _$PersonFromJson(json);
  }
  
  // Usage
  var person = Person(name: 'John', age: 42);
  person.copyWith(age: 43); // Person(name: 'John', age: 43)
  ```

- ⚠️ **Union Types/Sealed Classes**: For models with multiple states
  ```dart
  @freezed
  sealed class Result<T> with _$Result {
    const factory Result.success(T data) = Success;
    const factory Result.error(String message) = Error;
    
    factory Result.fromJson(Map<String, dynamic> json, T Function(Object?) fromJson) => 
        _$ResultFromJson(json, fromJson);
  }
  
  // Using pattern matching
  switch (result) {
    Success(:final data) => print('Success: $data'),
    Error(:final message) => print('Error: $message'),
  }
  ```

- ⚠️ **Deep copyWith**: For nested Freezed objects
  ```dart
  Company company = Company(name: 'Acme', director: Director(name: 'John'));
  
  // Instead of: company.copyWith(director: company.director.copyWith(name: 'Jane'))
  Company newCompany = company.copyWith.director(name: 'Jane');
  ```

- ⚠️ **JSON Serialization**: Use with json_serializable
  ```dart
  @Freezed(genericArgumentFactories: true)  // For generic types
  class ApiResponse<T> with _$ApiResponse<T> {
    const factory ApiResponse.data(T data) = ApiResponseData;
    const factory ApiResponse.error(String message) = ApiResponseError;
    
    factory ApiResponse.fromJson(
      Map<String, dynamic> json, 
      T Function(Object?) fromJsonT
    ) => _$ApiResponseFromJson(json, fromJsonT);
  }
  
  // Usage with generics
  final response = await apiClient.get<User>('/users/1');
  if (response case ApiResponseData(:final User data)) {
    // Use data
  }
  ```

- ⚠️ **Mutable Models**: When mutability is needed
  ```dart
  @unfreezed  // Instead of @freezed
  class MutablePerson with _$MutablePerson {
    factory MutablePerson({
      required String name,
      required int age,
    }) = _MutablePerson;
  }
  
  // Usage
  var person = MutablePerson(name: 'John', age: 42);
  person.name = 'Jane';  // Allowed with @unfreezed
  ```