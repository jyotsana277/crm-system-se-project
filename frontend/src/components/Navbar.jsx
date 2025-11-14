import { useContext } from "react";
import { IoIosLogOut } from "react-icons/io";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Navbar = () => {
  const { logoutUser } = useContext(AuthContext);

  const token = localStorage.getItem("authTokens");

  return (
    <nav className="w-full py-3 bg-white shadow">
      <div className="w-full flex justify-between items-center px-5">
        <Link className="text-xl font-semibold text-orange-400" to="/">
          CRM APP
        </Link>
        <div className="" id="navbarSupportedContent">
          <ul className="w-full flex justify-center items-center gap-6">
            {token ? (
              <>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="dashboard">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="records">
                    Records
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="loyalty">
                    Loyalty
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="campaigns">
                    Campaigns
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="company">
                    Company
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-orange-400 font-medium" to="support-tickets">
                    Support
                  </Link>
                </li>
                <li className="hover:bg-neutral-200 hover:text-orange-500 px-3 py-1 rounded-lg">
                  <button
                    type="button"
                    className="flex justify-center items-center gap-2 font-medium"
                    onClick={logoutUser}
                  >
                    Logout
                    <IoIosLogOut />
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="bg-orange-400 hover:bg-orange-500 text-neutral-50 px-4 py-2 rounded-lg font-medium">
                  <Link className="" to="/register">
                    Register
                  </Link>
                </li>
                <li className="hover:text-orange-400 font-medium">
                  <Link className="" to="/login">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
