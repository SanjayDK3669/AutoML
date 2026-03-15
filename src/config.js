export const RAG_URL    = "https://rag-agent-yd9m.onrender.com";
export const AUTOML_URL = "https://automl-da1t.onrender.com";

export const ragApi  = (path) => RAG_URL.replace(/\/$/, '') + path;
export const amlApi  = (path) => AUTOML_URL.replace(/\/$/, '') + path;

export const AML_STEPS = [
  { key: 'loading',  label: 'Loading Dataset',       icon: '📂' },
  { key: 'analysis', label: 'Analysing Columns',      icon: '🔍' },
  { key: 'report',   label: 'Generating Data Report', icon: '📝' },
  { key: 'drift',    label: 'Drift Analysis',         icon: '📈' },
  { key: 'training', label: 'Training Models',        icon: '🤖' },
  { key: 'saving',   label: 'Saving Model & Report',  icon: '💾' },
  { key: 'done',     label: 'Pipeline Complete',      icon: '✅' },
];

export const AML_SUGG = [
  'Which model performed best and why?',
  'Are there any missing values I should worry about?',
  'Was any data drift detected?',
  'What features are most important?',
  'How can I improve model accuracy?',
  'Summarise the dataset statistics.',
];
