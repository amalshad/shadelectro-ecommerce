import User from "../../models/userSchema.js";


const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";

        let page = parseInt(req.query.page) || 1;
        const limit = 3;
        const query = {
            isAdmin: false,
            $or: [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        };

        const allUsers = await User.find()
        const users = await User.find(query)
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query)
        const totalPages = Math.ceil(count / limit)


        res.render("customerManage", {
            customers: users,
            currentPage: page,
            totalPages,
            search,
            allUsers
        })

    } catch (error) {
        console.log("Error at Customer", error)
        res.redirect("/admin/404")
    }
}


const listCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ success: true, message: "Changed the User" })

    } catch (error) {

        console.error("Error at List Customer", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })

    }
}


export default { customerInfo, listCustomer }