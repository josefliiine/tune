import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useEffect } from "react";

interface ProtectedRoutesProps {
	redirect?: string
}

const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ redirect = "/login" }) => {
	const { currentUser } = useAuth();

	useEffect(() => {
		if (currentUser) {
			return;
		}
		console.error("Log in to access that page.");
	}, [currentUser]);

	return (
		currentUser
			? <Outlet />
			: <Navigate to={redirect} />
	)
}

export default ProtectedRoutes;
