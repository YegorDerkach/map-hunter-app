import { useHttp } from "@/hooks/useHttp"
import { API } from "./api"

const MapHunterService = () => {
    const { request, loading, error, clearError } = useHttp()



    // email,name,password
    const Registration = async (data: object) => {
        const res = await request(API.Registration, "POST", data)
        return await res;
    }
    // email, password 
    const LoggingIn = async (data: object) => {
        const res = await request(API.LoggingIn, "POST", data)
        return await res;
    }
    // file
    const PostFile = async (data: File) => {
        const res = await request(API.PostFile, "POST", data)
        return await res;
    }

    const PostPhoto = async (data: File) => {
        const res = await request(API.Photo, 'POST', data)
        return await res
    }

    const PostItem = async (data: object) => {
        const res = await request(API.Items, 'POST', data)
        return await res
    }

    const PostProfile = async (data: object) => {
        const res = await request(API.Profile, 'POST', data)
        return await res
    }

    const PostCreate = async (data: object) => {
        const res = await request(API.Create, 'POST', data)
        return await res;
    }

    const PostCreateEnemy = async (data: object) => {
        const res = await request(API.CreateEnemy, 'POST', data)
        return await res;
    }

    const CityEnemy = async () => {
        const res = await request(API.CityEnemy)
        return await res;
    }

    const EnemyKill = async (data: object) => {
        const res = await request(API.EnemyKill, 'POST', data)
        return await res;
    } 

    const PostBattlePhoto = async (data: File) => {
        const res = await request(API.BattlePhoto, 'POST', data)
        return await res
    } 

    const AiAsk = async (data: object) => {
        const res = await request(API.AskAi, 'POST', data)
        return await res;
    } 

    const GetPhotoProfile = async () => {
        const res = await request(API.PhotoProfile)
        return await res;
    }

    const PostPhotoUpload = async (data: object) => {
        const res = await request(API.PhotoUpload, 'POST', data)
        return await res;
    } 



    return {
        Registration,
        LoggingIn,
        loading,
        error,
        clearError,
        PostFile,
        PostPhoto,
        PostItem,
        PostProfile,
        PostCreate,
        PostCreateEnemy,
        CityEnemy,
        EnemyKill,
        PostBattlePhoto,
        AiAsk,
        GetPhotoProfile,
        PostPhotoUpload
    }
}

export default MapHunterService;
