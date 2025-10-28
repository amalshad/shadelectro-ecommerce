import User from "../models/userSchema.js";


const userAuth = async (req, res, next) => {
    try {
        const user = req.session.passport?.user || req.session.user
        //  req.session.userId = req.session.passport.user||req.session.user
        const userData = await User.findOne({ _id: user })
        if (userData) {
            if (userData && !userData.isBlocked) {
                return res.redirect("/")
            }

        } else {
            next()
        }
    } catch (error) {
        console.log("Error at userAuth", error)
        res.status(500).send("Internal Server Error")
    }
}


const adminAuth = async (req, res, next) => {
    try {

        if (req.session.admin) {
            const admin = await User.findById(req.session.admin);

            if (admin && admin.isAdmin) {
                return next();
            }
        }
        res.redirect("/admin/login");
    } catch (error) {
        console.error("Error at adminAuth:", error);
        res.status(500).send("Internal Server Error");
    }
};


const userBlock = async (req, res, next) => {
    try {
        const id = req.session.passport?.user || req.session.user
        if (id) {
            const user = await User.findById(id)
            if (user && user.isBlocked) {
                delete req.session.user
                return next()
            } else {

                return next()
            }
        }
        next()
    } catch (error) {
        console.error("Error at userBlock", error);
        res.status(500).send("Internal Server Error")

    }
}
const sessionAuth = async (req, res, next) => {
    try {
        const id = req.session.passport?.user || req.session.user
        const user = await User.findById(id)
        if (user && !user.isBlocked && !user.isAdmin) {
            return next()
        } else {
            return res.redirect("/login")
        }
    } catch (error) {
        console.error("Error at sessionAuth", error)
        res.status(500).send("Internal Server Error")
    }
}

export { userAuth, adminAuth, userBlock, sessionAuth }