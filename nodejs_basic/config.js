import dotenv from 'dotenv';
dotenv.config();

export const config = {
    prot:process.env.PORT || 8800,
    secret:process.env.APP_SECRET
}
