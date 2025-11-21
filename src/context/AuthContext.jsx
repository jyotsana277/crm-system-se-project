import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert2";

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );

  const [user, setUser] = useState(() => {
    const tokens = localStorage.getItem("authTokens");
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        return jwtDecode(parsed.access);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loginUser = async (email, password) => {
    try {
      let url = "http://127.0.0.1:8000/api/token/";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.status === 200) {
        setAuthTokens(data);
        setUser(jwtDecode(data.access));
        localStorage.setItem("authTokens", JSON.stringify(data));
        navigate("/dashboard");
        swal.fire({
          title: "Login Success",
          icon: "success",
          toast: true,
          timer: 6000,
          position: "top-right",
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        console.error("Login error:", data);
        const errorMsg = data?.detail || data?.email?.[0] || "Email or password is incorrect";
        swal.fire({
          title: "Login Failed",
          text: errorMsg,
          icon: "error",
          toast: true,
          timer: 6000,
          position: "top-right",
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Login request error:", error);
      swal.fire({
        title: "Connection Error",
        text: "Could not connect to the server. Make sure backend is running.",
        icon: "error",
        toast: true,
        timer: 6000,
        position: "top-right",
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const registerUser = async (
    full_name,
    email,
    username,
    password,
    password2
  ) => {
    try {
      let url = "http://127.0.0.1:8000/api/register/";
      const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name, email, username, password, password2 }),
    });
    const data = await response.json();

    if (response.status == 201) {
      navigate("/login");
      swal.fire({
        title: "Registration Success",
        icon: "success",
        toast: true,
        timer: 6000,
        position: "top-right",
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } else {
      console.log(response.status);
      console.log("Registration Error");
      console.log(data);
      
      // Extract error message from response
      let errorMessage = "There was a server error";
      if (data) {
        // Handle different error formats
        if (typeof data === 'object') {
          // Find first error message
          for (let key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              errorMessage = data[key][0];
              break;
            } else if (typeof data[key] === 'string') {
              errorMessage = data[key];
              break;
            }
          }
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      swal.fire({
        title: "Registration Error",
        text: errorMessage,
        icon: "error",
        toast: true,
        timer: 8000,
        position: "top-right",
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
    } catch (error) {
      console.error("Registration request failed:", error);
      swal.fire({
        title: "Network Error",
        text: "Could not connect to server. Make sure the backend is running on http://127.0.0.1:8000/",
        icon: "error",
        toast: true,
        timer: 8000,
        position: "top-right",
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login");
    swal.fire({
      title: "You have been logged out",
      icon: "success",
      toast: true,
      timer: 6000,
      position: "top-right",
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const updateToken = async () => {
    if (!authTokens || !authTokens.refresh) {
      logoutUser();
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: authTokens.refresh }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setAuthTokens(data);
        setUser(jwtDecode(data.access));
        localStorage.setItem("authTokens", JSON.stringify(data));
        return data.access;
      } else {
        logoutUser();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logoutUser();
    }
  };

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
    registerUser,
    loginUser,
    logoutUser,
    updateToken,
  };

  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode(authTokens.access));
    }
    setLoading(false);
  }, [authTokens, loading]);

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
