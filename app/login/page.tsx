'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Cookies from 'js-cookie';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('*&$@!asvab3372008');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formData = new URLSearchParams();
        formData.append('action', 'admin-login');
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(
                'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php', // direct API URL
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            if (result.status === 200 && result.isSuccess) {
                Cookies.set('admin-auth', 'true', { expires: 1 });
                router.push('/admin');
            } else {
                setError('Invalid username or password. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to connect to the server.');
        }
    };

    return (
        <section className="login-container py-5">
            <div className="card login-card p-4 shadow mx-auto" style={{ maxWidth: '400px' }}>
                <h4 className="text-center mb-4">Login to Your Account</h4>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-primary-custom w-50 mx-auto">Login</button>
                    </div>
                </form>
            </div>
        </section>
    );
}
