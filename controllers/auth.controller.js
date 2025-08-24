const signIn = async (req, res) => {
  res.status(200).json({ message: "Sign-in successful" });
};

const signUp = async (req, res) => {
  res.status(200).json({ message: "signUp successful" });
};

const signOut = async (req, res) => {
  res.status(200).json({ message: "Sign-out successful" });
};

export { signIn, signUp, signOut };
