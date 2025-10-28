import Category from "../../models/categorySchema.js";


const categoryInfo = async (req, res) => {

    try {

        let search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = ((page - 1) * limit)

        const query = { name: { $regex: search, $options: "i" } };

        const categoryData = await Category.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)


        const totalCategories = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalCategories / limit)

        res.render('category', {
            categories: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            search

        })
    } catch (error) {
        console.log("Error at category", error)
        res.redirect("/admin/404")
    }
}


const addCategory = async (req, res) => {

    const { name, description, } = req.body;
    try {
        const existingCategory = await Category.findOne({ name: { $regex: name, $options: "i" } });



        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        else {
            const newCategory = new Category({ name, description });

            await newCategory.save();
            return res.status(200).json({ message: "Category added successfully" });
        }
    } catch (error) {
        console.log("Error at addCategory", error);
        return res.status(500).json({ error: "Internal Server error" });
    }
};


const listCategory = async (req, res) => {
    try {

        const id = req.params.id;
        const category = await Category.findOne({ _id: id })

        if (!category) return res.status(404).json({ error: "Category is not found" });

        const newStatus = !category.isListed;
        await Category.updateOne({ _id: id }, { $set: { isListed: newStatus } });


        res.json({ success: true, isListed: newStatus, message: category.isListed ? "Category listed" : "Category unlisted" })


    } catch (error) {

        console.log("Error at listCategory", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}


const editCategory = async (req, res) => {

    const { name, description } = req.body;
    const id = req.params.id;

    try {

        const existing = await Category.findOne({ name: { $regex: name, $options: "i" }, _id: { $ne: id } });

        if (existing) {
            return res.status(400).json({ error: "Category already exists" });
        }

        await Category.findByIdAndUpdate(id, {name,description,});

        return res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
        console.log("Error at editCategory:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



export default { categoryInfo, addCategory, listCategory, editCategory };