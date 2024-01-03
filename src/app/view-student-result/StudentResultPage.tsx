'use client';

import {
  ExtendedParsedResultsType,
  ExtendedParsedResultsType2,
  ScoreObjectType2,
  ScoreObjectType3,
  SubjectScoreType,
  TableRow,
} from '@/lib/types/types';
import Image from 'next/image';
import { RHFSelect } from '@/components/RHFSelect';
import { sessions, terms } from '../../../constants';
import { useState } from 'react';
import { fetchStudentResult, validateStudent } from './action';
import DownloadStudentResultButton from './DownloadStudentButton';
import { SelectChangeEvent } from '@mui/material';
import { examinationsView } from '../../../constants/landingpage';
import profile from '../../assets/profile_placeholder.png';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResultPDF from './ResultPDF';
import ResultPDF2 from './ResultPDF2';
import { signIn, useSession } from 'next-auth/react';

const StudentResultpage = () => {
  const { data: session, status } = useSession();

  const [parsedResult, setParsedResult] = useState<ExtendedParsedResultsType2>();
  const [formValues, setFormValues] = useState({
    currentSession: '2023/2024',
    currentTerm: '',
    examination: '',
  });
  const [studentStatus, setStudentStatus] = useState('');

  const handleFormChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormValues((prevFormValues) => ({ ...prevFormValues, [name]: value }));
  };

  const updateResult = (data: ExtendedParsedResultsType2 | null) => {
    if (data) {
      setParsedResult(data);
      setStudentStatus('');
    } else
      setStudentStatus(
        'Your email is not registered with us. Kindly contact the school to register your email'
      );
  };

  const setTotal = () => {
    let value: string = '';
    if (formValues.examination) value = formValues.examination;
    let total;
    if (value === 'First CA' || value === 'Second CA') {
      total = 30.0;
    } else {
      total = 70.0;
    }
    return total;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const student = parsedResult ? parsedResult.student : null;
  const result = parsedResult ? parsedResult.result : null;

  const isExaminationSelected = !!formValues.examination;

  if (status === 'unauthenticated') {
    return (
      <div className="text-red-700 text-center font-bold">
        <h1>You are not authorized to access this page!</h1>
        <h1>Please sign in by clicking the button below to gain access.</h1>

        <a
          href="/api/auth/signin?callbackUrl=/view-student-result"
          className="btn btn-secondary my-4"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[600px] m-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RHFSelect
              name="currentSession"
              label="Session"
              options={sessions}
              value={formValues.currentSession}
              onChange={handleFormChange}
            />
            <RHFSelect
              name="currentTerm"
              label="Term"
              options={terms}
              value={formValues.currentTerm}
              onChange={handleFormChange}
            />
            <RHFSelect
              name="examination"
              label="Examination"
              options={examinationsView}
              value={formValues.examination}
              onChange={handleFormChange}
            />

            <DownloadStudentResultButton
              formValues={formValues}
              fetchStudentResult={fetchStudentResult}
              updateResult={updateResult}
            />
          </div>
        </form>
      </div>
      {parsedResult && (
        <>
          <>
            <p className="font-bold text-center text-2xl sm:text-4xl my-3">Student Result page</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 border-double border-4 border-indigo-600 gap-2 mb-3">
              <div className="flex items-center justify-center">
                <Image
                  alt={"student's Image"}
                  title={"student's Image"}
                  src={student?.profilePhotoUrl || profile}
                  width={200}
                  height={200}
                />
              </div>
              <div className="overflow-x-auto font-bold text-4xl">
                <table className="table table-zebra">
                  <tbody>
                    <tr className="hover">
                      <td>Name: </td>
                      <td>{`${student?.firstName} ${student?.lastName}`}</td>
                    </tr>
                    <tr className="hover">
                      <td>Current Class:</td>
                      <td>{student?.currentClass}</td>
                    </tr>
                    <tr className="hover">
                      <td>Gender:</td>
                      <td>{student?.gender}</td>
                    </tr>
                    <tr className="hover">
                      <td>Age:</td>
                      <td>{student?.age}</td>
                    </tr>
                    <tr>
                      <td>Session:</td>
                      <td>{formValues.currentSession}</td>
                    </tr>
                    <tr>
                      <td>Term:</td>
                      <td>{formValues.currentTerm}</td>
                    </tr>
                    <tr>
                      <td>Examination:</td>
                      <td>{formValues.examination || 'Terminal Result'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>

          <PDFDownloadLink
            document={
              isExaminationSelected ? (
                <ResultPDF
                  student={student}
                  result={result as SubjectScoreType[]}
                  setTotal={setTotal}
                />
              ) : (
                <ResultPDF2
                  student={student}
                  result={result as ScoreObjectType3}
                  setTotal={setTotal}
                />
              )
            }
            fileName={`${student?.firstName}_${student?.lastName}_Result.pdf`}
          >
            {({ loading }) => (
              <button disabled={loading}>
                {loading ? 'Generating PDF...' : 'Download Result as PDF'}
              </button>
            )}
          </PDFDownloadLink>

          <>
            {result && (
              <div className="border-dotted border-4">
                {isExaminationSelected ? (
                  <ExaminationTable
                    result={result as SubjectScoreType[]}
                    setTotal={() => setTotal()}
                  />
                ) : (
                  <TermTable result={result as ScoreObjectType3} />
                )}
              </div>
            )}
          </>
        </>
      )}
      {studentStatus && (
        <p className="text-center font-bold text-red-500 text-xl mt-5">{studentStatus}</p>
      )}
    </>
  );
};

type TermTableProps = {
  result: ScoreObjectType3;
};

type ExaminationTableProps = {
  result: SubjectScoreType[];
  setTotal: () => number;
};

const TermTable: React.FC<TermTableProps> = ({ result }) => {
  const subjects: string[] = [];

  if (result && result['First CA']) {
    result['First CA'].forEach((subject: any) => {
      subjects.push(Object.keys(subject)[0]);
    });
  }

  const getScore = (examType: string, subject: string) => {
    const index = result[examType].findIndex((subjectScore: SubjectScoreType) => {
      return Object.keys(subjectScore)[0] === subject;
    });
    if (index === -1) return '0.00';
    return result[examType][index][subject];
  };

  const table: TableRow[] = [];

  subjects.forEach((subject) => {
    const row = {
      Subject: subject,
      'First CA': getScore('First CA', subject),
      'Second CA': getScore('Second CA', subject),
      'Terminal Examination': getScore('Terminal Examination', subject),
    };
    table.push(row);
  });

  return (
    <div className="w-full overflow-x-auto">
      {table.length > 0 && (
        <table className="min-w-full table-zebra">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-6 py-3 text-left font-bold">Subjects</th>
              <th className="px-6 py-3 text-left font-bold">First CA</th>
              <th className="px-6 py-3 text-left font-bold">Second CA</th>
              <th className="px-6 py-3 text-left font-bold">Terminal Examination</th>
              <th className="px-6 py-3 text-left font-bold">Total %age</th>
              <th className="px-6 py-3 text-left font-bold">Remark</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => (
              <tr key={index} className="hover">
                <td className="px-6 py-4 ">{row.Subject}</td>
                <td className="px-6 py-4 text-center">{row['First CA']}</td>
                <td className="px-6 py-4 text-center">{row['Second CA']}</td>
                <td className="px-6 py-4 text-center">{row['Terminal Examination']}</td>
                <td className="px-6 py-4 text-center">
                  {(() => {
                    const percent =
                      ((parseFloat(row['Terminal Examination']) +
                        parseFloat(row['First CA']) +
                        parseFloat(row['Second CA'])) /
                        100) *
                      100;
                    return percent.toFixed(2);
                  })()}
                  %
                </td>
                <td className="badge badge-lg mt-4">
                  {(() => {
                    const percent =
                      ((parseFloat(row['Terminal Examination']) +
                        parseFloat(row['First CA']) +
                        parseFloat(row['Second CA'])) /
                        100) *
                      100;
                    return percent < 50.0
                      ? 'Needs help'
                      : percent >= 50.0 && percent < 60.0
                      ? 'Pass'
                      : percent >= 60.0 && percent < 70.0
                      ? 'Good'
                      : percent >= 70.0 && percent <= 80
                      ? 'Very Good'
                      : 'Excellent';
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {table.length === 0 && (
        <p className="text-center font-bold">No result available yet. Please check back later</p>
      )}
    </div>
  );
};

const ExaminationTable: React.FC<ExaminationTableProps> = ({ result, setTotal }) => {
  return (
    <div>
      {result.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="p-2 border border-gray-300">Subject</th>
              <th className="p-2 border border-gray-300">Grade</th>
              <th className="p-2 border border-gray-300">Remark</th>
            </tr>
          </thead>
          <tbody>
            {result.map((subjectScore, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="p-2 border border-gray-300">{Object.keys(subjectScore)[0]}</td>
                <td className="p-2 border border-gray-300 text-center">
                  {subjectScore[Object.keys(subjectScore)[0]]}
                </td>
                <td className="p-2 border border-gray-300 text-center">
                  {(parseFloat(subjectScore[Object.keys(subjectScore)[0]]) / setTotal()) * 100 >= 50
                    ? 'Pass'
                    : 'Needs Help'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center font-bold">No result available yet. Please check back later</p>
      )}
    </div>
  );
};

export default StudentResultpage;
