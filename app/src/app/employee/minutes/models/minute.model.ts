export interface MinuteContact {
  id: string;
  description: string;
  number: string;
  start_date: string;
  end_date: string;
  state: string;
  client_id: string;
  project_id: string;
  user_id: string;
  copies: string;
  created: string;
  modified: string;
}

export interface MinuteUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  img: string;
  name?: string;
}

export interface MinuteClient {
  id: string;
  name: string;
  img: string;
}

export interface MinuteProject {
  id: string;
  name: string;
  img: string;
  client_id?: string;
}

export interface MinuteAssistant {
  id: string;
  contac_id: string;
  user_id: string;
  type_user: string;
  state: string;
  User: MinuteUser;
}

export interface MinuteCommitment {
  id: string;
  description: string;
  delivery_date: string;
  finished_date?: string;
  state: string;
  priority: string;
  User?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    name?: string;
  };
}

export interface MinuteListItem {
  Contac: MinuteContact;
  User: MinuteUser;
  Client: MinuteClient;
  Project: MinuteProject;
}

export interface MinuteDetail {
  Contac: MinuteContact;
  User: MinuteUser;
  Client: MinuteClient;
  Project: MinuteProject;
  Commitment: MinuteCommitment[];
  Assistant: MinuteAssistant[];
}

export interface MinutesFilter {
  client_id?: string;
  project_id?: string;
}
