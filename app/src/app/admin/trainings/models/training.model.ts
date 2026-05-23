export type TrainingStatus = 'draft' | 'active' | 'inactive' | 'expired';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';
export type AssignmentMode = 'all' | 'all_with_exclusions' | 'selected';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  score: number;
  orderIndex: number;
  options: QuizOption[];
}

export interface TrainingQuiz {
  id: string;
  materialId: string;
  passingScore: number;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingAttachment {
  id: string;
  name: string;
  title: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface TrainingMaterial {
  id: string;
  trainingId: string;
  title: string;
  orderIndex: number;
  attachment: TrainingAttachment;
  quiz: TrainingQuiz | null;
  createdAt: string;
}

export interface TrainingAssignment {
  id: string;
  trainingId: string;
  employeeId: string;
  status: AssignmentStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isMandatory: boolean;
  assignmentMode: AssignmentMode;
  status: TrainingStatus;
  materials: TrainingMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingsListResponse {
  data: Training[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompletionReportAssignment {
  employeeId: string;
  employeeName: string;
  status: AssignmentStatus;
  completedAt: string | null;
}

export interface CompletionReport {
  trainingId: string;
  title: string;
  totalAssigned: number;
  completedCount: number;
  completionPercentage: number;
  assignments: CompletionReportAssignment[];
}

export interface ExcludedEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}
