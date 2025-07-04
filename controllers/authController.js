import { User } from '../models/user.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

export const logout = async (req, res) => {
    // const { userId } = req.body;

    try {
        // await User.findByIdAndUpdate(userId, { refreshToken: null });
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

export const signup = async (req, res) => {

    try {
        const { email, pass } = req.body;
        console.log("Signup request received:", email, pass);
        const accessToken = generateAccessToken(email);
        const refreshToken = generateRefreshToken(email);
        const user = new User({ email, password: pass, refreshToken: refreshToken });
        const savedUser = await user.save();
        await user.save();
        console.log(savedUser);
        res.status(200).json({ accessToken, user });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(400).json({ message: "Error while signing up!", error: error.message });
    }
}

export const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        console.log("No refresh token provided in authController line no. 60");
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)


        const user = await User.findOne({ _id: decoded._id });
        if (!user || user.refreshToken !== refreshToken) {
            console.log("Invalid refresh token provided in authController line no. 70");
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken(user._id);
        console.log(accessToken);
        res.status(201).json({ accessToken });
    } catch (error) {
        if(error.name === 'TokenExpiredError') {
            
            return res.status(401).json({ message: 'Refresh token expired' });
        }
        res.status(403).json({ message: 'Token refresh failed', error: error.message });
    }
};