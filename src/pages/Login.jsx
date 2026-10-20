import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import { authenticateEmployee } from '../utils/auth.js';
import { consumeAuthNotice } from '../utils/api.js';
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from '../components/Icons.jsx';
import csirLogo from '../assets/csir-logo.png';
import iipLogo from '../assets/iip-logo.png';

function Login({ onLogin }) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authNotice = consumeAuthNotice();

    if (authNotice) {
      setErrors({ form: authNotice });
    }
  }, []);

  const validateForm = () => {
    const nextErrors = {};

    if (!employeeId.trim()) {
      nextErrors.employeeId = 'Employee ID is required.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      const loginResponse = await authenticateEmployee(employeeId, password);
      window.setTimeout(() => {
        setIsLoading(false);
        onLogin(loginResponse.employee, loginResponse.token);
      }, 300);
    } catch (error) {
      setIsLoading(false);
      setErrors({ form: error.message || 'Invalid employee ID or password.' });
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <section className="login-brand">
          <div className="login-brand-logos">
            <img src={csirLogo} alt="CSIR emblem" className="login-brand-logo-csir" />
            <span className="login-brand-logo-divider" aria-hidden="true" />
            <img src={iipLogo} alt="CSIR-IIP logo" className="login-brand-logo-iip" />
          </div>

          <div className="login-brand-top">
            <p className="login-brand-tagline">
              Secure access to contractual research projects, milestone tracking, and revenue generation
            </p>
          </div>

          <div className="login-brand-copy">
            <h1>Project Registration Portal</h1>
          </div>

          <div className="login-illustration" aria-hidden="true">
            <div className="login-illustration-ring">
              <svg viewBox="0 0 220 220" className="login-molecule">
                <line x1="110" y1="110" x2="60" y2="60" />
                <line x1="110" y1="110" x2="165" y2="55" />
                <line x1="110" y1="110" x2="45" y2="150" />
                <line x1="110" y1="110" x2="150" y2="165" />
                <line x1="110" y1="110" x2="170" y2="130" />
                <circle className="node node-core" cx="110" cy="110" r="16" />
                <circle className="node" cx="60" cy="60" r="9" />
                <circle className="node" cx="165" cy="55" r="7" />
                <circle className="node" cx="45" cy="150" r="8" />
                <circle className="node" cx="150" cy="165" r="10" />
                <circle className="node" cx="170" cy="130" r="6" />
              </svg>
            </div>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-inner">
            <header className="login-form-header">
              <div className="login-form-brand">
                <img src={csirLogo} alt="CSIR-IIP logo" className="login-brand-logo" />
                <strong>CSIR-IIP</strong>
              </div>
              <span className="login-access-tag">Employee Access</span>
            </header>

            <h2 id="login-title">Access Your Workspace</h2>
            <p className="login-copy">Manage projects with ease.</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label>
                Employee ID
                <input
                  type="text"
                  value={employeeId}
                  placeholder="EMP001"
                  onChange={(event) => setEmployeeId(event.target.value)}
                  aria-invalid={Boolean(errors.employeeId)}
                />
                {errors.employeeId ? <span className="field-error">{errors.employeeId}</span> : null}
              </label>

              <label>
                Password
                <div className="password-field">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    placeholder="Enter password"
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {errors.password ? <span className="field-error">{errors.password}</span> : null}
              </label>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon size={18} />
                  </>
                )}
              </Button>

              {errors.form ? <div className="form-error">{errors.form}</div> : null}
            </form>

            <div className="login-note">
              <span>Designed for efficient management of contractual research projects</span>
            </div>

            <footer className="login-form-footer">
              <span>{`© ${new Date().getFullYear()} CSIR-IIP`}</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
