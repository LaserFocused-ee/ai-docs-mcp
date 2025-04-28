# Linear SDK Documentation

## Introduction

This document explores the Linear SDK (@linear/sdk) to understand how it interacts with the Linear GraphQL API, with detailed focus on Issues, Projects, and Initiatives functionality.

## Package Information

- **Name**: @linear/sdk
- **Version**: 39.0.0
- **Description**: The Linear Client SDK for interacting with the Linear GraphQL API
- **Main File**: dist/index-cjs.min.js

The SDK is built using GraphQL and TypeScript, providing a strongly-typed interface to the Linear API.

## Issue Operations

### 1. Create Issue

```typescript
createIssue(input: IssueCreateInput): LinearFetch<IssuePayload>
```

#### IssueCreateInput

```typescript
type IssueCreateInput = {
    /** The identifier of the user to assign the issue to. */
    assigneeId?: string;
    /** The date when the issue was completed. Must be in the past and after createdAt date. */
    completedAt?: Date;
    /** Create issue as a user with the provided name. Only for OAuth applications. */
    createAsUser?: string;
    /** The date when the issue was created. Must be in the past. */
    createdAt?: Date;
    /** The cycle associated with the issue. */
    cycleId?: string;
    /** The issue description in markdown format. */
    description?: string;
    /** The date at which the issue is due. */
    dueDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The estimated complexity of the issue. */
    estimate?: number;
    /** The identifier in UUID v4 format. If none is provided, the backend will generate one. */
    id?: string;
    /** The identifiers of the issue labels associated with this ticket. */
    labelIds?: string[];
    /** The ID of the last template applied to the issue. */
    lastAppliedTemplateId?: string;
    /** The identifier of the parent issue. */
    parentId?: string;
    /** The priority of the issue. 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low. */
    priority?: number;
    /** The project associated with the issue. */
    projectId?: string;
    /** The project milestone associated with the issue. */
    projectMilestoneId?: string;
    /** The team state of the issue. */
    stateId?: string;
    /** The identifiers of the users subscribing to this ticket. */
    subscriberIds?: string[];
    /** The identifier of the team associated with the issue. */
    teamId: string; // Required
    /** The title of the issue. */
    title: string; // Required
}
```

### 2. Update Issue

```typescript
updateIssue(id: string, input: IssueUpdateInput): LinearFetch<IssuePayload>
```

#### IssueUpdateInput

```typescript
type IssueUpdateInput = {
    /** The identifiers of the issue labels to be added to this issue. */
    addedLabelIds?: string[];
    /** The identifier of the user to assign the issue to. */
    assigneeId?: string;
    /** The cycle associated with the issue. */
    cycleId?: string;
    /** The issue description in markdown format. */
    description?: string;
    /** The date at which the issue is due. */
    dueDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The estimated complexity of the issue. */
    estimate?: number;
    /** The identifiers of the issue labels associated with this ticket. */
    labelIds?: string[];
    /** The identifier of the parent issue. */
    parentId?: string;
    /** The priority of the issue. 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low. */
    priority?: number;
    /** The project associated with the issue. */
    projectId?: string;
    /** The project milestone associated with the issue. */
    projectMilestoneId?: string;
    /** The identifiers of the issue labels to be removed from this issue. */
    removedLabelIds?: string[];
    /** The team state of the issue. */
    stateId?: string;
    /** The identifiers of the users subscribing to this ticket. */
    subscriberIds?: string[];
    /** The identifier of the team associated with the issue. */
    teamId?: string;
    /** The issue title. */
    title?: string;
}
```

### 3. Batch Create Issues

```typescript
issueBatchCreate(input: IssueBatchCreateInput): LinearFetch<IssueBatchPayload>
```

#### IssueBatchCreateInput

```typescript
type IssueBatchCreateInput = {
    /** The issues to create. */
    issues: IssueCreateInput[];
}
```

### 4. Batch Update Issues

```typescript
issueBatchUpdate(ids: string[], input: IssueUpdateInput): LinearFetch<IssueBatchPayload>
```

### 5. Delete Issue

```typescript
issueDelete(id: string, permanentlyDelete?: boolean): LinearFetch<IssueArchivePayload>
```

### 6. Link Issue to Parent

```typescript
// Method 1: Using the parentId field in create/update
createIssue({ parentId: "parent-issue-id", ...otherFields })
updateIssue(id, { parentId: "parent-issue-id", ...otherFields })

// Method 2: Converting an issue to a subtask
convertIssueToSubtask(issueId: string, parentIssueId: string): LinearFetch<IssuePayload>
```

## Project Operations

### 1. Create Project

```typescript
createProject(input: ProjectCreateInput): LinearFetch<ProjectPayload>
```

#### ProjectCreateInput

```typescript
type ProjectCreateInput = {
    /** The color of the project. */
    color?: string;
    /** The project content as markdown. */
    content?: string;
    /** The ID of the issue from which that project is created. */
    convertedFromIssueId?: string;
    /** The description for the project. */
    description?: string;
    /** The icon of the project. */
    icon?: string;
    /** The identifier in UUID v4 format. If none is provided, the backend will generate one. */
    id?: string;
    /** The ID of the last template applied to the project. */
    lastAppliedTemplateId?: string;
    /** The identifier of the project lead. */
    leadId?: string;
    /** The identifiers of the members of this project. */
    memberIds?: string[];
    /** The name of the project. */
    name: string;
    /** The priority of the project. 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low. */
    priority?: number;
    /** The planned start date of the project. */
    startDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The ID of the project status. */
    statusId?: string;
    /** The planned target date of the project. */
    targetDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The identifiers of the teams this project is associated with. */
    teamIds: string[]; // Required
}
```

### 2. Update Project

```typescript
updateProject(id: string, input: ProjectUpdateInput): LinearFetch<ProjectPayload>
```

#### ProjectUpdateInput

```typescript
type ProjectUpdateInput = {
    /** The date when the project was canceled. */
    canceledAt?: Date;
    /** The color of the project. */
    color?: string;
    /** The date when the project was completed. */
    completedAt?: Date;
    /** The project content as markdown. */
    content?: string;
    /** The ID of the issue from which that project is created. */
    convertedFromIssueId?: string;
    /** The description for the project. */
    description?: string;
    /** The icon of the project. */
    icon?: string;
    /** The identifier of the project lead. */
    leadId?: string;
    /** The identifiers of the members of this project. */
    memberIds?: string[];
    /** The name of the project. */
    name?: string;
    /** The priority of the project. 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low. */
    priority?: number;
    /** The planned start date of the project. */
    startDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The ID of the project status. */
    statusId?: string;
    /** The planned target date of the project. */
    targetDate?: string; // TimelessDate format: YYYY-MM-DD
    /** The identifiers of the teams this project is associated with. */
    teamIds?: string[];
}
```

### 3. Delete Project

```typescript
deleteProject(id: string): LinearFetch<ProjectArchivePayload>
```

### 4. Link Issues to Project

```typescript
// Method 1: When creating an issue
createIssue({ projectId: "project-id", ...otherFields })

// Method 2: When updating an issue
updateIssue(id, { projectId: "project-id", ...otherFields })

// Method 3: Using a dedicated API method
addIssueToProject(issueId: string, projectId: string): LinearFetch<{
  success: boolean;
  issue: {
    id: string;
    identifier: string;
    title: string;
    project: {
      id: string;
      name: string;
    };
  };
}>
```

### 5. Get Project Issues

```typescript
getProjectIssues(projectId: string, limit?: number): LinearFetch<Issue[]>
```

## Initiative Operations

### 1. Create Initiative

```typescript
createInitiative(input: InitiativeCreateInput): LinearFetch<InitiativePayload>
```

#### InitiativeCreateInput

```typescript
type InitiativeCreateInput = {
    /** The initiative's color. */
    color?: string;
    /** The initiative's content in markdown format. */
    content?: string;
    /** The description of the initiative. */
    description?: string;
    /** The initiative's icon. */
    icon?: string;
    /** The identifier in UUID v4 format. If none is provided, the backend will generate one. */
    id?: string;
    /** The name of the initiative. */
    name: string;
    /** The owner of the initiative. */
    ownerId?: string;
    /** The sort order of the initiative within the organization. */
    sortOrder?: number;
    /** The initiative's status. */
    status?: string; // InitiativeStatus
    /** The estimated completion date of the initiative. */
    targetDate?: string; // TimelessDate format: YYYY-MM-DD
}
```

### 2. Update Initiative

```typescript
updateInitiative(id: string, input: InitiativeUpdateInput): LinearFetch<InitiativePayload>
```

#### InitiativeUpdateInput

```typescript
type InitiativeUpdateInput = {
    /** The initiative's color. */
    color?: string;
    /** The initiative's content in markdown format. */
    content?: string;
    /** The description of the initiative. */
    description?: string;
    /** The initiative's icon. */
    icon?: string;
    /** The name of the initiative. */
    name?: string;
    /** The owner of the initiative. */
    ownerId?: string;
    /** The sort order of the initiative within the organization. */
    sortOrder?: number;
    /** The initiative's status. */
    status?: string; // InitiativeStatus
    /** The estimated completion date of the initiative. */
    targetDate?: string; // TimelessDate format: YYYY-MM-DD
    /** Whether the initiative has been trashed. */
    trashed?: boolean;
}
```

### 3. Delete Initiative

```typescript
deleteInitiative(id: string): LinearFetch<InitiativeArchivePayload>
```

### 4. Link Initiative to Project

```typescript
// Create a link between an initiative and a project
createInitiativeToProject(input: InitiativeToProjectCreateInput): LinearFetch<InitiativeToProjectPayload>
```

#### InitiativeToProjectCreateInput

```typescript
type InitiativeToProjectCreateInput = {
    /** The identifier in UUID v4 format. If none is provided, the backend will generate one. */
    id?: string;
    /** The identifier of the initiative. */
    initiativeId: string;
    /** The identifier of the project. */
    projectId: string;
    /** The sort order for the project within its organization. */
    sortOrder?: number;
}
```

### 5. Delete Initiative-Project Link

```typescript
deleteInitiativeToProject(id: string): LinearFetch<DeletePayload>
```

## Document Content

Both Projects and Initiatives support detailed document content through their respective `content` fields, which accept markdown formatting.

### Project Document Content

The `content` field in projects allows for detailed, structured documentation. This field supports markdown formatting, allowing you to organize information with headers, lists, tables, code blocks, and more.

```typescript
// Example of creating a project with structured content
createProject({
    name: "New Feature X",
    teamIds: ["team-id"],
    description: "A brief description of Feature X (under 255 characters)",
    content: `# Feature X Overview

## Goals and Objectives
- Implement X functionality
- Improve user experience for Y workflow

## Technical Requirements
* Backend API changes
* Frontend component updates
* Database schema modifications

## Implementation Timeline
1. Research phase - 2 weeks
2. Development phase - 4 weeks  
3. Testing phase - 2 weeks

## Dependencies
* Feature Z must be completed first
* API rate limits need to be increased

## Success Metrics
- 20% reduction in workflow time
- 15% increase in user adoption`
})
```

### Initiative Document Content

Similar to projects, initiatives also support detailed content through the `content` field, which can be populated with markdown-formatted documentation.

```typescript
// Example of creating an initiative with document content
createInitiative({
    name: "Q3 Platform Improvements",
    description: "Enhancements to the platform for Q3",
    content: `# Q3 Platform Improvements

## Strategic Goals
- Improve system performance
- Enhance user experience
- Expand API capabilities

## Key Projects
* Performance optimization
* UI modernization
* API versioning

## Timeline
1. July: Planning and architecture
2. August: Development
3. September: Testing and roll-out

## Expected Outcomes
- 30% improvement in page load time
- Reduced bounce rate by 15%
- Increase in API usage by 25%`
})
```

## Document Attachments

Linear provides a dedicated Document API that allows you to create separate document objects attached to projects and initiatives. Unlike the `content` field which is part of the project/initiative object itself, these documents are separate entities with their own properties and can be managed independently.

### 1. Create a Document

```typescript
createDocument(input: DocumentCreateInput): LinearFetch<DocumentPayload>
```

#### DocumentCreateInput

```typescript
type DocumentCreateInput = {
    /** The content of the document in markdown format. */
    content: string;
    /** The icon of the document. */
    icon?: string;
    /** The identifier in UUID v4 format. If none is provided, the backend will generate one. */
    id?: string;
    /** The initiative this document is associated with. */
    initiativeId?: string;
    /** The project this document is associated with. */
    projectId?: string;
    /** The title of the document. */
    title: string;
}
```

### 2. Update a Document

```typescript
// Direct method - get document and update it
const document = await linearClient.document(documentId);
await document.update({ content: "New content" });

// Using the client method
updateDocument(id: string, input: DocumentUpdateInput): LinearFetch<DocumentPayload>
```

#### DocumentUpdateInput

```typescript
type DocumentUpdateInput = {
    /** The content of the document in markdown format. */
    content?: string;
    /** The icon of the document. */
    icon?: string;
    /** The initiative this document is associated with. */
    initiativeId?: string;
    /** The project this document is associated with. */
    projectId?: string;
    /** The title of the document. */
    title?: string;
}
```

### 3. Fetch Documents

```typescript
// Get all documents for a project
const documents = await linearClient.documents({
    filter: {
        project: {
            id: { eq: "project-id" }
        }
    }
});

// Get all documents for an initiative
const documents = await linearClient.documents({
    filter: {
        initiative: {
            id: { eq: "initiative-id" }
        }
    }
});

// Get a specific document by ID
const document = await linearClient.document("document-id");
```

### 4. Example: Creating and Managing Project Documents

```typescript
// Create a new document for a project
const documentResult = await linearClient.createDocument({
    title: "Technical Specification",
    content: "# Technical Specification\n\n## Architecture\n\nDetailed technical specifications...",
    projectId: "project-id"
});

// Update an existing document
const document = await linearClient.document(documentResult.document.id);
await document.update({
    content: "# Updated Technical Specification\n\n## Revised Architecture\n\nUpdated specifications..."
});

// Get all documents for a project
const projectDocuments = await linearClient.documents({
    filter: {
        project: {
            id: { eq: "project-id" }
        }
    }
});

// Display document information
for (const doc of projectDocuments.nodes) {
    console.log(`Document: ${doc.title} - ${doc.url}`);
}
```

### 5. Difference Between Document API and Content Field

| Feature | Project/Initiative Content Field | Document API |
| ------- | ------------------------------- | ------------ |
| Storage | Part of the project/initiative object | Separate entity with its own ID |
| Access | Single content field per project/initiative | Multiple documents can be attached |
| URL | No dedicated URL | Each document has a unique URL |
| UI Representation | Displayed in the main content area | Listed separately in the Documents tab |
| Updates | Updated with the parent object | Can be updated independently |
| Sharing | Shared along with the project | Can be shared independently |

## Best Practices

### 1. Document Structure

- Use the `content` field for detailed documentation (supports markdown)
- Keep the `description` field brief (limited to 255 characters)
- Use markdown headers, lists, and formatting to organize content
- Include relevant sections: Overview, Goals, Requirements, Timeline, etc.

### 2. Using Documents vs. Content Field

- **Content Field**: Use for core project/initiative information that should always be visible
  - Main specifications, requirements, overview, and project structure
  - Information that should be immediately available when viewing the project
  - Content that is central to understanding the project's purpose

- **Document API**: Use for supplementary or specialized documentation 
  - Detailed technical specifications
  - Design documents and wireframes (as markdown with links to assets)
  - Meeting notes and decisions
  - Research findings
  - External resources and references
  - Implementation guides
  - Documentation that benefits from separate organization

### 3. Issue Organization

- Create a hierarchical structure with parent issues and sub-issues
- Link issues to relevant projects using the `projectId` field
- Add relevant labels to categorize issues
- Set appropriate priorities and due dates

### 4. Project and Initiative Hierarchy

- Link projects to initiatives using the `initiativeToProject` relationship
- Ensure each project has one or more associated teams via `teamIds`
- Use milestones within projects to mark important deliverables
- Assign appropriate team members as leads and collaborators

### 5. Workflow

1. Create initiatives for high-level organizational goals
2. Create projects for specific bodies of work
3. Link projects to initiatives
4. Create parent issues within projects
5. Create sub-issues for detailed work items
6. Use batch operations for efficiency when creating multiple related issues

## Common Patterns and Examples

### Creating a Complete Project Structure

```typescript
// 1. Create an initiative
const initiativeResult = await linearClient.createInitiative({
    name: "Platform Redesign",
    description: "Redesign of the core platform UI and functionality",
    content: "# Platform Redesign Initiative\n\n[Detailed markdown content here]"
});

// 2. Create a project
const projectResult = await linearClient.createProject({
    name: "User Dashboard Redesign",
    teamIds: ["team-id"],
    description: "Revamp of user dashboard UI and functionality",
    content: "# User Dashboard Redesign\n\n[Detailed markdown content here]"
});

// 3. Link project to initiative
await linearClient.createInitiativeToProject({
    initiativeId: initiativeResult.initiative.id,
    projectId: projectResult.project.id
});

// 4. Create parent issues
const parentIssueResult = await linearClient.createIssue({
    title: "Implement new dashboard layout",
    description: "Create the new dashboard layout based on design specs",
    teamId: "team-id",
    projectId: projectResult.project.id
});

// 5. Create sub-issues
await linearClient.createIssue({
    title: "Create responsive grid component",
    description: "Implement the responsive grid for dashboard widgets",
    teamId: "team-id",
    projectId: projectResult.project.id,
    parentId: parentIssueResult.issue.id
});
```

### Batch Creating Issues

```typescript
// Batch create multiple issues at once
await linearClient.issueBatchCreate({
    issues: [
        {
            title: "Implement login flow",
            description: "Create new login flow with 2FA",
            teamId: "team-id",
            projectId: "project-id"
        },
        {
            title: "Update navigation menu",
            description: "Implement the redesigned navigation menu",
            teamId: "team-id", 
            projectId: "project-id"
        },
        {
            title: "Fix API rate limiting",
            description: "Implement proper rate limiting for the API",
            teamId: "team-id",
            projectId: "project-id"
        }
    ]
});
```

### Batch Updating Issues

```typescript
// Update multiple issues at once
await linearClient.issueBatchUpdate(
    ["issue-id-1", "issue-id-2", "issue-id-3"],
    {
        stateId: "state-id-for-in-progress",
        priority: 2 // High priority
    }
);
```

This comprehensive documentation should provide a solid foundation for working with the Linear API through the SDK, covering all the requested operations and their parameters in detail.