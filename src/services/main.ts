// Main page and generic API handlers and types

export type FrogWarsResponse = {
    code: number        // We use HTTP status codes
    message?: string    // only if code is not 200
}

export const clientError = (message: string): FrogWarsResponse => {
    return {
        code: 400,
        message,
    }
}

export const serverError = (message: string): FrogWarsResponse => {
    return {
        code: 500,
        message,
    }
}

export const IndexPage: FrogWarsResponse & {game: string, author: string} = {
    code: 200, 
    game: "https://game.frog-wars.com", 
    author: "https://dao.frogwifcat.com"
}
