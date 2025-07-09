export interface NotionConfig {
    token: string;
    version?: string;
}

export interface NotionPage {
    object: 'page';
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: NotionUser;
    last_edited_by: NotionUser;
    cover: NotionFile | null;
    icon: NotionIcon | null;
    parent: NotionParent;
    archived: boolean;
    in_trash: boolean;
    properties: Record<string, NotionProperty>;
    url: string;
    public_url?: string;
}

export interface NotionDatabase {
    object: 'database';
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: NotionUser;
    last_edited_by: NotionUser;
    title: NotionRichText[];
    description: NotionRichText[];
    icon: NotionIcon | null;
    cover: NotionFile | null;
    properties: Record<string, NotionDatabaseProperty>;
    parent: NotionParent;
    url: string;
    archived: boolean;
    in_trash: boolean;
    is_inline: boolean;
    public_url?: string;
}

export interface NotionBlock {
    object: 'block';
    id: string;
    parent: NotionParent;
    created_time: string;
    last_edited_time: string;
    created_by: NotionUser;
    last_edited_by: NotionUser;
    has_children: boolean;
    archived: boolean;
    in_trash: boolean;
    type: string;
    [key: string]: unknown; // Type-specific properties
}

export interface NotionUser {
    object: 'user';
    id: string;
    type?: 'person' | 'bot';
    name?: string;
    avatar_url?: string;
    person?: {
        email?: string;
    };
    bot?: {
        owner: {
            type: 'workspace';
            workspace: boolean;
        } | {
            type: 'user';
            user: NotionUser;
        };
        workspace_name?: string;
    };
}

export interface NotionComment {
    object: 'comment';
    id: string;
    parent: NotionParent;
    discussion_id: string;
    created_time: string;
    last_edited_time: string;
    created_by: NotionUser;
    rich_text: NotionRichText[];
}

export interface NotionRichText {
    type: 'text' | 'mention' | 'equation';
    text?: {
        content: string;
        link?: {
            url: string;
        } | null;
    };
    mention?: {
        type: 'user' | 'page' | 'database' | 'date' | 'link_preview' | 'template_mention';
        user?: NotionUser;
        page?: { id: string };
        database?: { id: string };
        date?: {
            start: string;
            end?: string | null;
            time_zone?: string | null;
        };
        link_preview?: { url: string };
        template_mention?: {
            type: 'template_mention_date' | 'template_mention_user';
            template_mention_date?: 'today' | 'now';
            template_mention_user?: 'me';
        };
    };
    equation?: {
        expression: string;
    };
    annotations: {
        bold: boolean;
        italic: boolean;
        strikethrough: boolean;
        underline: boolean;
        code: boolean;
        color: NotionColor;
    };
    plain_text: string;
    href?: string | null;
}

export interface NotionProperty {
    id: string;
    type: string;
    [key: string]: unknown; // Type-specific values
}

export interface NotionDatabaseProperty {
    id: string;
    name: string;
    type: string;
    [key: string]: unknown; // Type-specific configuration
}

export interface NotionParent {
    type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
    block_id?: string;
}

export interface NotionIcon {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: {
        url: string;
    };
    file?: {
        url: string;
        expiry_time: string;
    };
}

export interface NotionFile {
    type: 'external' | 'file';
    external?: {
        url: string;
    };
    file?: {
        url: string;
        expiry_time: string;
    };
}

export type NotionColor =
    | 'default'
    | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'
    | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background'
    | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

export interface NotionSearchResults {
    object: 'list';
    results: (NotionPage | NotionDatabase)[];
    next_cursor: string | null;
    has_more: boolean;
    type?: 'page_or_database';
    page_or_database?: object;
}

export interface NotionDatabaseQueryResults {
    object: 'list';
    results: NotionPage[];
    next_cursor: string | null;
    has_more: boolean;
    type?: 'page';
    page?: object;
}

export interface NotionBlockChildren {
    object: 'list';
    results: NotionBlock[];
    next_cursor: string | null;
    has_more: boolean;
    type?: 'block';
    block?: object;
}

export interface NotionCommentResults {
    object: 'list';
    results: NotionComment[];
    next_cursor: string | null;
    has_more: boolean;
    type?: 'comment';
    comment?: object;
}

export interface NotionUserResults {
    object: 'list';
    results: NotionUser[];
    next_cursor: string | null;
    has_more: boolean;
    type?: 'user';
    user?: object;
}

// Filter and sort interfaces for database queries
export interface NotionDatabaseFilter {
    and?: NotionDatabaseFilter[];
    or?: NotionDatabaseFilter[];
    property?: string;
    [key: string]: unknown;
}

export interface NotionDatabaseSort {
    property?: string;
    direction: 'ascending' | 'descending';
    timestamp?: 'created_time' | 'last_edited_time';
}

// Request/Response interfaces
export interface CreatePageRequest {
    parent: NotionParent;
    properties?: Record<string, unknown>;
    children?: unknown[];
    icon?: NotionIcon;
    cover?: NotionFile;
}

export interface UpdatePageRequest {
    properties?: Record<string, unknown>;
    archived?: boolean;
    in_trash?: boolean;
    icon?: NotionIcon;
    cover?: NotionFile;
}

export interface AppendBlockChildrenRequest {
    children: unknown[];
    after?: string;
}

export interface CreateCommentRequest {
    parent: NotionParent;
    rich_text: NotionRichText[];
}

export interface DatabaseQueryRequest {
    database_id: string;
    filter?: NotionDatabaseFilter;
    sorts?: NotionDatabaseSort[];
    start_cursor?: string;
    page_size?: number;
}

export interface SearchRequest {
    query?: string;
    sort?: {
        direction: 'ascending' | 'descending';
        timestamp: 'last_edited_time';
    };
    filter?: {
        value: 'page' | 'database';
        property: 'object';
    };
    start_cursor?: string;
    page_size?: number;
}
