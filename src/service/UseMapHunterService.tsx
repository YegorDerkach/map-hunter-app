import { useHttp } from "@/hooks/useHttp"
import { API } from "./api"

const MapHunterService = () => {
    const { request, loading, error, clearError } = useHttp()


    const data = {
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "system",
                content: "Your answers should be short, 2-3 sentences maximum"
            },
            {
                role: "user",
                content: "monsters for a fantasy map game"
            }
        ]
    }

    const AiChating = async () => {
        const res = await request(API.AiChating, "POST", data)
        return await res;
    }

    // email,name,password
    const Registration = async(data: object) =>{
        const res = await request(API.Registration, "POST", data)
        return await res;
    }
    // email, password 
    const LoggingIn = async (data : object) =>{
        const res = await request(API.LoggingIn, "POST", data)
        return await res;
    }
    // file
    const PostFile = async (data : File) =>{
        const res = await request(API.PostFile, "POST", data)
        return await res;
    }





    return { AiChating,Registration,LoggingIn, loading, error, clearError, PostFile}
}

export default MapHunterService;
