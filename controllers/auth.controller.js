import User from "../models/user.model.js";
import { comparePassword, generateToken, hashPassword } from "../utils/auth.js";

const signIn = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email }).populate(
    "subjects",
    "title description code students"
  );
  if (!existingUser) {
    return res.status(404).json({ message: "Invalid Email" });
  }

  const isValidPassword = await comparePassword(
    password,
    existingUser.password
  );
  if (!isValidPassword) {
    return res.status(404).json({ message: "Incorrect Password" });
  }

  const token = generateToken(existingUser._id);

  // convert mongoose document to plain object
  const userData = existingUser.toObject();
  delete userData.password; // remove password

  res.status(200).json({
    message: "Sign in successfully",
    access_token: token,
    user: userData,
  });
};

const signUp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const registeredEmail = await User.findOne({ email });
    console.log(registeredEmail);
    if (registeredEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    console.log(newUser);
    res.status(200).json({
      message: "Account created successfully.",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const signOut = async (req, res) => {
  res.status(200).json({ message: "Sign-out successful" });
};

export { signIn, signUp, signOut };
