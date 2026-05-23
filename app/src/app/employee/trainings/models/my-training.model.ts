export type TrainingStatus = 'draft' | 'active' | 'inactive' | 'expired';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface MyQuizOption {
  id: string;
  text: string;
  orderIndex: number;
  // isCorrect NO se expone al empleado
}

export interface MyQuizQuestion {
  id: string;
  text: string;
  orderIndex: number;
  options: MyQuizOption[];
}

export interface MyQuiz {
  id: string;
  passingScore: number;
  questions: MyQuizQuestion[];
}

export interface MyTrainingAttachment {
  id: string;
  url: string;
  mimeType: string;
  title: string;
}

export interface MyMaterialProgress {
  id: string;
  isCompleted: boolean;
  quizScore: number | null;
  quizPassed: boolean | null;
  attempts: number;
  completedAt: string | null;
}

export interface MyTrainingMaterial {
  id: string;
  title: string;
  orderIndex: number;
  attachment: MyTrainingAttachment;
  quiz: MyQuiz | null;
  progress: MyMaterialProgress | null;
  isAccessible: boolean;
}

export interface MyTrainingAssignment {
  id: string;
  status: AssignmentStatus;
  completedAt: string | null;
}

export interface MyTraining {
  id: string;
  title: string;
  description: string | null;
  isMandatory: boolean;
  status: TrainingStatus;
  startsAt: string;
  endsAt: string;
  materials: MyTrainingMaterial[];
  assignment: MyTrainingAssignment;
}

export interface MyTrainingListItem {
  training: {
    id: string;
    title: string;
    description: string | null;
    isMandatory: boolean;
    status: TrainingStatus;
    startsAt: string | null;
    endsAt: string | null;
  };
  assignment: MyTrainingAssignment;
  progress: {
    completed: number;
    total: number;
  };
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  passingScore: number;
  incorrectQuestions: {
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    correctOptionId: string;
  }[];
}
