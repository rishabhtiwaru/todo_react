import React, { useState, useContext } from 'react';
import axios from 'axios';
import UserContext from './UserContext';
import { Redirect } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [redirect, setRedirect] = useState(false);

  const user = useContext(UserContext);

  function registerUser(e) {
    e.preventDefault();

    const data = { email, password };
    axios.post('http://localhost:4000/register', data, { withCredentials: true })
      .then(response => {
        user.setEmail(response.data.email);
        setEmail('');
        setPassword('');
        setRedirect(true);
      })
      .catch(error => {
        if (error.response && error.response.data && error.response.data.message) {
          setRegistrationError(error.response.data.message);
        } else {
          setRegistrationError('An unexpected error occurred');
        }
      });
  }

  if (redirect) {
    return <Redirect to="/" />;
  }

  return (
    <form onSubmit={registerUser}>
      <div>{registrationError}</div>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
