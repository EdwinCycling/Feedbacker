export const sentiments = ['Positive', 'Mixed', 'Needs attention', 'Neutral'] as const;
export const statuses = ['New', 'Reviewing', 'Planned', 'Done'] as const;
export const priorities = ['Low', 'Medium', 'High'] as const;
export type Sentiment = typeof sentiments[number];
export type Status = typeof statuses[number];
export type Priority = typeof priorities[number];

export interface Feedback {
  id: string;
  sourceId: string;
  title: string;
  customer: string;
  product: string;
  date: string;
  topics: string[];
  sentiment: Sentiment;
  priority: Priority;
  status: Status;
  notes: string;
  excerpt: string;
  evidence: string;
}

export interface Source {
  id: string;
  filename: string;
  customer: string;
  product: string;
  date: string;
  summary: string;
  text: string;
  modifiedAt: string;
  tags?: string[];
}

export interface Snapshot {
  sources: Source[];
  feedback: Feedback[];
  scannedAt: string | null;
  warnings: string[];
}

export type FeedbackEdits = Pick<Feedback, 'title' | 'customer' | 'product' | 'date' | 'topics' | 'sentiment' | 'priority' | 'status' | 'notes'>;

export interface Notebook {
  title: string;
  content: string;
  revision: number;
  updatedAt: string | null;
}
