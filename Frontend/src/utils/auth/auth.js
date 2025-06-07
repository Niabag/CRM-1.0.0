import Cookies from "js-cookie";

function isAuthenticated() {
    const token = Cookies.get("token")
    const userId = Cookies.get("userId")

    if(!token && !userId){
        return false
    }else{
        return true
    }
}

export default isAuthenticated 