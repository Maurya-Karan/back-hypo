import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const verifyAccessToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Token required' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Access Token' });
        req.user = user;
        next();
    });
};

const verifyRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh Token required' });

    try {
        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(403).json({ message: 'Invalid Refresh Token' });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export { verifyAccessToken, verifyRefreshToken };