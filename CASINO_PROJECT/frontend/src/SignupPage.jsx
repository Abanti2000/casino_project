// import React, { useState } from 'react';
// import './SignupPage.css';
// import { useNavigate } from 'react-router-dom';

// const SignupPage = () => {
//   const navigate = useNavigate();
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [checked, setChecked] = useState(true);

//   return (
//     <div className="signup-root">
//       {/* Header Bar */}
//       <div className="signup-header-bar">
//         <div className="signup-header-left">
//           <div className="signup-logo">
//             <span className="logo-dis">DIS</span>
//             <span className="logo-88">88</span>
//           </div>
//         </div>
//         <div className="signup-header-right">
//           <button className="header-login-btn" onClick={() => navigate('/login')}>LOGIN</button>
//           <button className="header-close-btn" onClick={() => navigate('/')}>×</button>
//         </div>
//       </div>

//       {/* Title */}
//       <h2 className="signup-title">SIGN UP</h2>

//       {/* Card */}
//       <div className="signup-card">
//         <div className="signup-card-title">Enter your account information</div>
//         <form className="signup-form">
//           <div className="signup-field">
//             <label className="signup-label">Username</label>
//             <div className="signup-input-container">
//               <input type="text" className="signup-input" placeholder="Set your username" autoComplete="username" />
//             </div>
//           </div>

//           <div className="signup-field">
//             <label className="signup-label">Phone number</label>
//             <div className="signup-phone-header">
//               <div className="signup-phone-flag">
//                 <img src="/flag.jpg" alt="MY" className="signup-flag" />
//                 <span className="signup-country-code">+60</span>
//                 <span className="signup-dropdown">▼</span>
//               </div>
//               <span className="signup-placeholder">eg 123456789</span>
//             </div>
//             <div className="signup-input-container">
//               <input type="tel" className="signup-input" placeholder="Phone number" autoComplete="tel" />
//             </div>
//           </div>

//           <div className="signup-field">
//             <label className="signup-label">Password</label>
//             <div className="signup-input-container">
//               <input type={showPassword ? "text" : "password"} className="signup-input" placeholder="Create password" autoComplete="new-password" />
//               <button type="button" className="signup-eye" onClick={() => setShowPassword(v => !v)}>
//                 <img src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png" alt="Show/Hide" style={{width: '20px', height: '20px'}} />
//               </button>
//             </div>
//           </div>

//           <div className="signup-field">
//             <label className="signup-label">Confirm password</label>
//             <div className="signup-input-container">
//               <input type={showConfirm ? "text" : "password"} className="signup-input" placeholder="Type password again" autoComplete="new-password" />
//               <button type="button" className="signup-eye" onClick={() => setShowConfirm(v => !v)}>
//                 <img src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png" alt="Show/Hide" style={{width: '20px', height: '20px'}} />
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>

//       {/* Checkbox */}
//       <div className="signup-checkbox-row">
//         <input type="checkbox" checked={checked} onChange={() => setChecked(v => !v)} id="signup-age" />
//         <label htmlFor="signup-age">
//           I am 18 years old and have read <span className="signup-terms">terms & conditions</span>
//         </label>
//       </div>

//       {/* Submit Button */}
//       <button className="signup-btn">SUBMIT</button>

//       {/* Divider */}
//       <div className="signup-divider-row">
//         <div className="signup-divider" />
//         <span className="signup-or">or</span>
//         <div className="signup-divider" />
//       </div>

//       {/* Google Button */}
//       <button className="signup-google-btn">
//         <span className="signup-google-g">G</span>
//       </button>

//       {/* Customer Service */}
//       <div className="signup-customer-row">
//         Any issues? Please contact our <span className="signup-customer-link">customer service</span>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;



import React, { useState } from 'react';
import './SignupPage.css';
import { useNavigate } from 'react-router-dom';

const countries = [
  { code: '+60', name: 'Malaysia', flag: '/flag-my.png' },
  { code: '+91', name: 'India', flag: '/flag-in.png' },
  { code: '+1', name: 'USA', flag: '/flag-us.png' },
  { code: '+44', name: 'UK', flag: '/flag-uk.png' }
];

const SignupPage = () => {
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checked, setChecked] = useState(true);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checked) {
      alert('You must confirm you are 18+ and agree to Terms & Conditions.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const payload = {
        username: username.trim(),
        // phone: `${selectedCountry.code}${phone.trim()}`,
        password: password.trim(),
      };

      console.log("Attempting signup with:", payload);

      const response = await fetch("http://localhost:8001/api/webapi/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
           body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Signup failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Signup Success:", data);

      alert("Signup successful!");
      navigate('/login'); // redirect to login page
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again.");
    }
  };

  return (
    <div className="signup-root">
      {/* Header Bar */}
      <div className="signup-header-bar">
        <div className="signup-header-left">
          <div className="signup-logo">
            <span className="logo-dis">DIS</span>
            <span className="logo-88">88</span>
          </div>
        </div>
        <div className="signup-header-right">
          <button className="header-login-btn" onClick={() => navigate('/login')}>LOGIN</button>
          <button className="header-close-btn" onClick={() => navigate('/')}>×</button>
        </div>
      </div>

      {/* Title */}
      <h2 className="signup-title">SIGN UP</h2>

      {/* Card */}
      <div className="signup-card">
        <div className="signup-card-title">Enter your account information</div>
        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="signup-field">
            <label className="signup-label">Username</label>
            <div className="signup-input-container">
              <input
                type="text"
                className="signup-input"
                placeholder="Set your username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="signup-field">
            <label className="signup-label">Phone number</label>
            <div className="signup-phone-header" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="signup-phone-flag">
                <img src={selectedCountry.flag} alt={selectedCountry.name} className="signup-flag" />
                <span className="signup-country-code">{selectedCountry.code}</span>
                <span className="signup-dropdown">▼</span>
              </div>
              <span className="signup-placeholder">eg 123456789</span>
            </div>
            {dropdownOpen && (
              <div className="signup-dropdown-menu">
                {countries.map((c) => (
                  <div
                    key={c.code}
                    className="signup-dropdown-item"
                    onClick={() => {
                      setSelectedCountry(c);
                      setDropdownOpen(false);
                    }}
                  >
                    <img src={c.flag} alt={c.name} className="signup-flag" />
                    <span>{c.name} ({c.code})</span>
                  </div>
                ))}
              </div>
            )}
            <div className="signup-input-container">
              <input
                type="tel"
                className="signup-input"
                placeholder="Phone number"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="signup-field">
            <label className="signup-label">Password</label>
            <div className="signup-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="signup-input"
                placeholder="Create password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="signup-eye" onClick={() => setShowPassword(v => !v)}>
                <img
                  src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png"
                  alt="Show/Hide"
                  style={{ width: '20px', height: '20px' }}
                />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="signup-field">
            <label className="signup-label">Confirm password</label>
            <div className="signup-input-container">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="signup-input"
                placeholder="Type password again"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="signup-eye" onClick={() => setShowConfirm(v => !v)}>
                <img
                  src="https://img.icons8.com/ios-glyphs/30/cccccc/visible--v1.png"
                  alt="Show/Hide"
                  style={{ width: '20px', height: '20px' }}
                />
              </button>
            </div>
          </div>

          {/* Checkbox */}
          <div className="signup-checkbox-row">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(v => !v)}
              id="signup-age"
            />
            <label htmlFor="signup-age">
              I am 18 years old and have read <span className="signup-terms">terms & conditions</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="signup-btn">SUBMIT</button>
        </form>
      </div>

      {/* Divider */}
      <div className="signup-divider-row">
        <div className="signup-divider" />
        <span className="signup-or">or</span>
        <div className="signup-divider" />
      </div>

      {/* Google Button */}
      <button className="signup-google-btn">
        <span className="signup-google-g">G</span>
      </button>

      {/* Customer Service */}
      <div className="signup-customer-row">
        Any issues? Please contact our <span className="signup-customer-link">customer service</span>
      </div>
    </div>
  );
};

export default SignupPage;
