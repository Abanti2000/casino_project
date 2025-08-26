// import React, { useState } from 'react';
// import './LoginPage.css';
// import { useNavigate } from 'react-router-dom';

// const LoginPage = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('username');
//   const [showPassword, setShowPassword] = useState(false);

//   return (
//     <div className="login-root">
//       {/* Header Bar */}
//       <div className="login-header-bar">
//         <div className="login-header-left">
//           <div className="login-logo">
//             <span className="logo-dis">DIS</span>
//             <span className="logo-88">88</span>
//           </div>
//         </div>
//         <div className="login-header-right">
//           <button className="header-signup-btn" onClick={() => navigate('/signup')}>SIGN UP</button>
//           <button className="header-close-btn" onClick={() => navigate('/')}>×</button>
//         </div>
//       </div>

//       {/* Title */}
//       <h2 className="login-title">LOGIN</h2>

//       {/* Tabs */}
//       <div className="login-tabs">
//         <button 
//           className={`login-tab ${activeTab === 'username' ? 'active' : ''}`}
//           onClick={() => setActiveTab('username')}
//         >
//           Username
//         </button>
//         <button 
//           className={`login-tab ${activeTab === 'mobile' ? 'active' : ''}`}
//           onClick={() => setActiveTab('mobile')}
//         >
//           Mobile
//         </button>
//         <button 
//           className={`login-tab ${activeTab === 'email' ? 'active' : ''}`}
//           onClick={() => setActiveTab('email')}
//         >
//           Email
//         </button>
//       </div>

//       {/* Card */}
//       <div className="login-card">
//         <form className="login-form">
//           <div className="login-field">
//             <input 
//               type="text" 
//               className="login-input" 
//               placeholder={activeTab === 'username' ? "Enter Your Username" : activeTab === 'mobile' ? "Enter Your Mobile" : "Enter Your Email"}
//               autoComplete={activeTab === 'username' ? "username" : activeTab === 'mobile' ? "tel" : "email"}
//             />
//           </div>

//           <div className="login-field">
//             <div className="login-input-container">
//               <input 
//                 type={showPassword ? "text" : "password"} 
//                 className="login-input" 
//                 placeholder="Password"
//                 autoComplete="current-password"
//               />
//               <button type="button" className="login-eye" onClick={() => setShowPassword(v => !v)}>
//                 <img src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png" alt="Show/Hide" style={{width: '20px', height: '20px'}} />
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>

//       {/* Login Button */}
//       <button className="login-btn">LOGIN</button>

//       {/* Divider */}
//       <div className="login-divider-row">
//         <div className="login-divider" />
//         <span className="login-or">or</span>
//         <div className="login-divider" />
//       </div>

//       {/* Google Button */}
//       <button className="login-google-btn">
//         <span className="login-google-g">G</span>
//       </button>

//       {/* Forgot Password */}
//       <div className="login-forgot-row">
//         <span className="login-forgot-link" onClick={() => navigate('/forgot-password')}>Forgot your password?</span>
//       </div>

//       {/* Customer Service */}
//       <div className="login-customer-row">
//         Any issues? Please contact our <span className="login-customer-link">customer service</span>
//       </div>
//     </div>
//   );
// };

// export default LoginPage; 


import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('username');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // handle login click
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', { username: username.trim() });
      
      const response = await fetch("http://localhost:8001/api/webapi/login", { 
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      });

      console.log('Response status:', response.status);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Login response:', data);

      if (data.status) {
        // Login success
        try {
          // Save token and user data
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          if (data.data) {
            localStorage.setItem("user", JSON.stringify(data.data));
          }
          
          console.log('Login successful, redirecting...');
          
          // Small delay to ensure storage is complete
          setTimeout(() => {
            navigate("/");
          }, 100);
          
        } catch (storageError) {
          console.warn('LocalStorage error:', storageError);
          // Continue anyway - localStorage might be disabled
          navigate("/");
        }
      } else {
        // Login failed
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle different types of errors
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check if the server is running on port 8001.");
      } else if (err.message.includes('500')) {
        setError("Server error. Please try again later.");
      } else if (err.message.includes('400')) {
        setError("Invalid request. Please check your credentials.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="login-root">
      {/* Header Bar */}
      <div className="login-header-bar">
        <div className="login-header-left">
          <div className="login-logo">
            <span className="logo-dis">DIS</span>
            <span className="logo-88">88</span>
          </div>
        </div>
        <div className="login-header-right">
          <button className="header-signup-btn" onClick={() => navigate('/signup')}>SIGN UP</button>
          <button className="header-close-btn" onClick={() => navigate('/')}>×</button>
        </div>
      </div>

      {/* Title */}
      <h2 className="login-title">LOGIN</h2>

      {/* Tabs */}
      <div className="login-tabs">
        <button 
          className={`login-tab ${activeTab === 'username' ? 'active' : ''}`}
          onClick={() => setActiveTab('username')}
        >
          Username
        </button>
        <button 
          className={`login-tab ${activeTab === 'mobile' ? 'active' : ''}`}
          onClick={() => setActiveTab('mobile')}
        >
          Mobile
        </button>
        <button 
          className={`login-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Email
        </button>
      </div>

      {/* Card */}
      <div className="login-card">
        <form className="login-form" onSubmit={handleFormSubmit}>
          <div className="login-field">
            <input 
              type="text" 
              className="login-input" 
              placeholder={
                activeTab === 'username'
                  ? "Enter Your Username"
                  : activeTab === 'mobile'
                  ? "Enter Your Mobile"
                  : "Enter Your Email"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              autoComplete={activeTab === 'username' ? "username" : activeTab === 'mobile' ? "tel" : "email"}
              disabled={loading}
              required
            />
          </div>

          <div className="login-field">
            <div className="login-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="login-input" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button 
                type="button" 
                className="login-eye" 
                onClick={() => setShowPassword(v => !v)}
                disabled={loading}
              >
                <img 
                  src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png" 
                  alt="Show/Hide" 
                  style={{width: '20px', height: '20px'}} 
                />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Login Button */}
      <button 
        className="login-btn" 
        onClick={handleLogin}
        disabled={loading}
        style={{
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'LOGGING IN...' : 'LOGIN'}
      </button>
      
      {/* Error Display */}
      {error && (
        <div style={{ 
          color: "#dc3545", 
          textAlign: 'center', 
          marginTop: '10px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Divider */}
      <div className="login-divider-row">
        <div className="login-divider" />
        <span className="login-or">or</span>
        <div className="login-divider" />
      </div>

      {/* Google Button */}
      <button className="login-google-btn" disabled={loading}>
        <span className="login-google-g">G</span>
      </button>

      {/* Forgot Password */}
      <div className="login-forgot-row">
        <span 
          className="login-forgot-link" 
          onClick={() => !loading && navigate('/forgot-password')}
          style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Forgot your password?
        </span>
      </div>

      {/* Customer Service */}
      <div className="login-customer-row">
        Any issues? Please contact our <span className="login-customer-link">customer service</span>
      </div>
    </div>
  );
};

export default LoginPage;