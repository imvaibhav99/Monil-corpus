import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from './env.js';
import { tokenTypes } from './tokens.js';
import { User } from '../app/user/model/user.model.js';

const jwtOptions = {
  secretOrKey: env.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      return done(new Error('Invalid token type'), false);
    }
    const user = await User.findById(payload.sub);
    if (!user) return done(null, false);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
