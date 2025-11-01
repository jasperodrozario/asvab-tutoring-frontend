'use client';

import { FaBook, FaUsers, FaQuestionCircle, FaChalkboardTeacher } from 'react-icons/fa';

export default function AdminDashboard() {
  const cards = [
    {
      label: 'Total AR Questions',
      value: 246,
      icon: <FaQuestionCircle size={32} />,
      bg: 'bg-primary',
    },
    {
      label: 'Total MK Questions',
      value: 137,
      icon: <FaBook size={32} />,
      bg: 'bg-success',
    },
    {
      label: 'Total Students',
      value: 528,
      icon: <FaUsers size={32} />,
      bg: 'bg-info',
    },
    {
      label: 'Total Tutors',
      value: 42,
      icon: <FaChalkboardTeacher size={32} />,
      bg: 'bg-warning text-dark',
    },
  ];

  return (
    <div className='mt-2'>
      <h5 className="mb-4">Dashboard</h5>
      <div className="row">
        {cards.map((card, idx) => (
          <div className="col-md-3 mb-4" key={idx}>
            <div className={`card text-white ${card.bg} h-100`}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-2">{card.label}</h6>
                  <h3 className="card-text">{card.value}</h3>
                </div>
                <div>{card.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
