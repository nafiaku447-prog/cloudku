/**
 * Auth Routes
 * @file server/routes/auth.ts
 */

import express from 'express';
import {
    googleAuth,
    githubAuth,
    register,
    login,
    getMe,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/github
 * @desc    GitHub OAuth login/register
 * @access  Public
 */
router.post('/github', githubAuth);

/**
 * @route   POST /api/auth/register
 * @desc    Register dengan email/password
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login dengan email/password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private (requires token)
 */
router.get('/me', authenticate, getMe);

export default router;
