# Freezed Guide for Flutter

A concise guide to using Freezed effectively in Flutter applications for data models, serialization, and union types.

## Motivation

Dart data models require significant boilerplate code for constructors, properties, equality checks, toString(), hashCode, copyWith(), and JSON serialization. Freezed eliminates hundreds of manual lines of code by implementing these features automatically, allowing you to focus on your model's definition rather than its implementation.

## Setup Requirements

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

After installation, run the code generator:

```dart
dart run build_runner watch -d
```

## Basic Usage

### Immutable Data Models

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'person.freezed.dart';
part 'person.g.dart'; // Only if using JSON serialization

@freezed
class Person with _$Person {
  const factory Person({
    required String firstName,
    required String lastName,
    required int age,
  }) = _Person;
  
  factory Person.fromJson(Map<String, dynamic> json) => 
      _$PersonFromJson(json);
}

// Usage
var person = Person(firstName: 'John', lastName: 'Doe', age: 42);
var personCopy = person.copyWith(age: 43); // Person(firstName: 'John', lastName: 'Doe', age: 43)
```

### Adding Methods or Getters

```dart
@freezed
class Person with _$Person {
  // Add a private constructor to enable methods/getters
  const Person._();
  
  const factory Person({
    required String firstName,
    required String lastName,
    required int age,
  }) = _Person;
  
  String get fullName => '$firstName $lastName';
  
  bool get isAdult => age >= 18;
  
  factory Person.fromJson(Map<String, dynamic> json) => _$PersonFromJson(json);
}
```

## Union Types / Sealed Classes

Use multiple constructors for models with different states:

```dart
@freezed
sealed class Result<T> with _$Result {
  const factory Result.success(T data) = Success;
  const factory Result.loading() = Loading;
  const factory Result.error(String message) = Error;
  
  factory Result.fromJson(Map<String, dynamic> json, T Function(Object?) fromJson) => 
      _$ResultFromJson(json, fromJson);
}

// Using pattern matching
switch (result) {
  Success(:final data) => print('Success: $data'),
  Loading() => print('Loading...'),
  Error(:final message) => print('Error: $message'),
}

// Alternative pattern matching with if-case
if (result case Success(:final data)) {
  print('Success: $data');
} else if (result case Error(:final message)) {
  print('Error: $message');
}
```

## JSON Serialization

### Basic Models

For basic models, add fromJson factory and the g.dart part declaration:

```dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

// Usage
final user = User.fromJson({'id': '1', 'name': 'John', 'email': 'john@example.com'});
final json = user.toJson(); // {'id': '1', 'name': 'John', 'email': 'john@example.com'}
```

### Custom Field Names

Use JsonKey to customize field names:

```dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    @JsonKey(name: 'email_address') required String email,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

### Union Types with JSON

For union types, Freezed uses runtimeType to determine the constructor:

```dart
@freezed
sealed class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse.data(T data) = ApiResponseData;
  const factory ApiResponse.error(String message) = ApiResponseError;
  
  factory ApiResponse.fromJson(
    Map<String, dynamic> json, 
    T Function(Object?) fromJsonT
  ) => _$ApiResponseFromJson(json, fromJsonT);
}

// JSON format:
// {"runtimeType": "data", "data": {...}}
// {"runtimeType": "error", "message": "Error message"}
```

### Custom Type Discriminator

Customize the type field and values:

```dart
@Freezed(unionKey: 'type', unionValueCase: FreezedUnionCase.pascal)
sealed class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse.data(T data) = ApiResponseData;
  
  @FreezedUnionValue('CustomError')  // Override specific value
  const factory ApiResponse.error(String message) = ApiResponseError;
  
  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) => 
      _$ApiResponseFromJson(json, fromJsonT);
}

// JSON format:
// {"type": "Data", "data": {...}}
// {"type": "CustomError", "message": "Error message"}
```

### Generic Type Serialization

For generic models:

```dart
@Freezed(genericArgumentFactories: true)
class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse.data(T data) = ApiResponseData;
  const factory ApiResponse.error(String message) = ApiResponseError;
  
  factory ApiResponse.fromJson(
    Map<String, dynamic> json, 
    T Function(Object?) fromJsonT
  ) => _$ApiResponseFromJson(json, fromJsonT);
}

// Usage
final responseJson = await fetchData();
final response = ApiResponse<User>.fromJson(
  responseJson,
  (json) => User.fromJson(json as Map<String, dynamic>)
);
```

## Deep CopyWith

For nested Freezed objects:

```dart
@freezed
class Company with _$Company {
  const factory Company({
    String? name,
    required Director director,
  }) = _Company;
  
  factory Company.fromJson(Map<String, dynamic> json) => _$CompanyFromJson(json);
}

@freezed
class Director with _$Director {
  const factory Director({
    String? name,
    Assistant? assistant,
  }) = _Director;
  
  factory Director.fromJson(Map<String, dynamic> json) => _$DirectorFromJson(json);
}

@freezed
class Assistant with _$Assistant {
  const factory Assistant({
    String? name,
    int? age,
  }) = _Assistant;
  
  factory Assistant.fromJson(Map<String, dynamic> json) => _$AssistantFromJson(json);
}

// Using deep copyWith
Company company = Company(
  name: 'Acme',
  director: Director(name: 'John', assistant: Assistant(name: 'Jane', age: 30))
);

// Instead of:
Company newCompany = company.copyWith(
  director: company.director.copyWith(
    assistant: company.director.assistant?.copyWith(
      name: 'Alice',
    ),
  ),
);

// Use:
Company newCompany = company.copyWith.director.assistant!(name: 'Alice');

// With null safety
Company newCompany = company.copyWith.director.assistant?.call(name: 'Alice');
```

## Mutable Models

Use @unfreezed for mutable properties:

```dart
@unfreezed
class MutablePerson with _$MutablePerson {
  factory MutablePerson({
    required String name,
    required int age,
    required final String id, // This will remain immutable
  }) = _MutablePerson;
  
  factory MutablePerson.fromJson(Map<String, dynamic> json) => _$MutablePersonFromJson(json);
}

// Usage
var person = MutablePerson(name: 'John', age: 42, id: 'user-123');
person.name = 'Jane';  // Allowed
person.age = 43;       // Allowed
// person.id = 'new-id'; // Error - final property
```

## Asserts and Default Values

```dart
@freezed
class Person with _$Person {
  @Assert('name.isNotEmpty', 'name cannot be empty')
  @Assert('age >= 0', 'age cannot be negative')
  const factory Person({
    required String name,
    @Default(18) int age,
    @Default([]) List<String> hobbies,
  }) = _Person;
}
```

## Configuration

### Project-wide Settings

In build.yaml file:

```yaml
targets:
  $default:
    builders:
      freezed:
        options:
          # Common options
          copy_with: true  # Enable/disable copyWith
          equal: true      # Enable/disable == operator
          to_string: true  # Enable/disable toString
          
          # Union type options
          union_key: 'type'  # Key for union type discriminator
          union_value_case: pascal  # Casing for union type values
          
          # Other options
          generic_argument_factories: true  # Enable for all generic classes
          make_collections_unmodifiable: true  # Immutable collections
```

### Class-specific Settings

```dart
@Freezed(
  copyWith: false,  // Disable copyWith for this class
  equal: false,     // Disable equality for this class
  makeCollectionsUnmodifiable: false,  // Allow mutable collections
)
class Example with _$Example {
  const factory Example(List<String> items) = _Example;
}
```

## Best Practices

1. Use immutable models (@freezed) by default, only use @unfreezed when necessary
2. Prefer sealed classes with named constructors for union types
3. Always run code generation after model changes
4. Use pattern matching with switch/case for handling union types
5. For complex JSON structures, consider custom JSON converters
6. Create small, focused models rather than large, complex ones
7. For nullable fields, use deep copy with ?. operator
8. Add proper assertions to validate model invariants
9. Document non-obvious fields with comments