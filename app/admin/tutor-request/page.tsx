"use client";

import { useEffect, useState } from "react";

interface TutorRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  state_id: string;
  message: string;
  request_from: string;
}

export default function TutorRequestPage() {
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const formData = new FormData();
      formData.append("action", "get-tutor-requests");

      try {
        const res = await fetch("/api/proxy", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data?.status === 200 && Array.isArray(data.data)) {
          setRequests(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch tutor requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="container my-5">
      <h1 className="mb-4">Tutor Request List</h1>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="alert alert-info">No tutor requests found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>State ID</th>
                <th>Message</th>
                <th>Request From</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.name}</td>
                  <td>{req.email}</td>
                  <td>{req.phone}</td>
                  <td>{req.state_id}</td>
                  <td>{req.message}</td>
                  <td>{req.request_from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
