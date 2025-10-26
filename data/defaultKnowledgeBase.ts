import { KnowledgeBaseEntry } from '../types';

export const KNOWLEDGE_BASE_VERSION = '1.2'; // Version to force data refresh

export const defaultKnowledgeBase: KnowledgeBaseEntry[] = [
  // General information
  { id: 'gen1', topic: 'What are the school opening and closing times?', information: 'Opening (secondary)- 7:30. Closing(Secondary)- 1:10. Opening(Primary)- 1:15. Closing(primary)- 6:00' },
  { id: 'gen2', topic: 'Where is the main office located?', information: 'On the ground floor' },
  { id: 'gen3', topic: 'Who is the principal of the school?', information: 'Ms. Rakhi Mukherjee' },
  { id: 'gen4', topic: 'Who is the vice principal?', information: 'Ms. Shubhangi Amonkar' },
  { id: 'gen5', topic: 'How can I contact the administration?', information: 'Details are given in your handbook.' },
  { id: 'gen6', topic: "What is the school's email address?", information: 'There are several. Refer to the handbook.' },
  { id: 'gen7', topic: 'Are visitors allowed inside the school?', information: 'Yes, during fests, competitions, parent teacher meets, etc.' },
  { id: 'gen8', topic: 'Is there a school handbook available?', information: 'Yes, given on the first day of school.' },
  { id: 'gen9', topic: 'How can I get information about school fees?', information: 'For details, visit https://ppsijc.org/' },
  { id: 'gen10', topic: 'Where is the lost and found?', information: 'Lost items can be retrieved from the supervisor’s office.' },
  { id: 'gen11', topic: 'Do you have a student ID system?', information: 'Students IDs are provided by the class teacher.' },
  { id: 'gen12', topic: "What is the school's motto?", information: 'Not just another school.' },
  { id: 'gen13', topic: 'Can you provide information about the school history?', information: 'For details, visit https://ppsijc.org/' },

  // Academics & Classes
  { id: 'acad1', topic: 'Where can I find the timetable?', information: 'Provided by the class teacher.' },
  { id: 'acad2', topic: 'What subjects are taught here?', information: 'Visit the school website for further details. https://ppsijc.org/' },
  { id: 'acad3', topic: 'Where are the classrooms located?', information: 'Grades 1 / 6 to 3 / 8 (Second floor). Grades 4 / 9 to 5 / 10 (Third Floor).' },
  { id: 'acad4', topic: 'Do you have special classes for advanced students?', information: 'Advanced Math and German as 7th subjects in grade 9 and 10' },
  { id: 'acad5', topic: 'Do you have remedial classes?', information: 'Yes. Details are provided by the teacher of the subject.' },
  { id: 'acad6', topic: 'Who can I contact for academic counseling?', information: 'Ms. Shraddha Kumar. Details given in the handbook.' },

  // Library
  { id: 'lib1', topic: 'Where is the library?', information: 'On the fourth floor' },
  { id: 'lib2', topic: 'What are the library timings?', information: 'Details given in the handbook' },
  { id: 'lib3', topic: 'How can I borrow books?', information: 'Details given in the handbook.' },
];