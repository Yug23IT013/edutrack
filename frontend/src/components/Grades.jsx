import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axios.get('/api/grades', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setGrades(res.data);
        setLoading(false);
      } catch (err) {
        setError(err?.response?.data?.message || err?.response?.data?.msg || 'Failed to fetch grades');
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Grades</h2>
      {grades.length === 0 ? (
        <p>No grades found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Student</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade._id}>
                <td>{grade.assignment.title}</td>
                <td>{grade.student.name}</td>
                <td>{grade.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Grades;
