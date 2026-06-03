const { Group, GroupMember, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

async function getOrCreateUserGroup(user_id) {
  const membership = await GroupMember.findOne({ where: { user_id } });
  if (membership) return membership.group_id;

  const group = await Group.create({
    group_name: "Gia đình của tôi",
    invite_code: uuidv4().slice(0, 8).toUpperCase(),
    user_uuid: user_id,
  });
  await GroupMember.create({ user_id, group_id: group.id, role: "Admin" });
  return group.id;
}

function getGroupWithMembers(group_id) {
  return Group.findByPk(group_id, {
    include: [{
      model: User,
      as: "members",
      attributes: ["id", "name", "email"],
      through: { attributes: ["role"] },
    }],
  });
}

const getCurrentGroup = async (req, res) => {
  try {
    const group_id = await getOrCreateUserGroup(req.user.id);
    const group = await getGroupWithMembers(group_id);

    res.status(200).json({ group });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { group_name } = req.body;
    const group = await Group.create({
      group_name: group_name || "Gia đình của tôi",
      invite_code: uuidv4().slice(0, 8).toUpperCase(),
      user_uuid: req.user.id,
    });

    await GroupMember.destroy({ where: { user_id: req.user.id } });
    await GroupMember.create({ user_id: req.user.id, group_id: group.id, role: "Admin" });
    const groupWithMembers = await getGroupWithMembers(group.id);
    res.status(201).json({ group: groupWithMembers });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateCurrentGroup = async (req, res) => {
  try {
    const { group_name } = req.body;
    const group_id = await getOrCreateUserGroup(req.user.id);
    const group = await Group.findByPk(group_id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    await group.update({
      group_name: group_name?.trim() || group.group_name,
    });

    const groupWithMembers = await getGroupWithMembers(group.id);
    res.status(200).json({ group: groupWithMembers });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) return res.status(400).json({ error: "invite_code is required" });

    const group = await Group.findOne({
      where: { invite_code: invite_code.trim().toUpperCase() },
    });
    if (!group) return res.status(404).json({ error: "Invite code not found" });

    const currentMembership = await GroupMember.findOne({ where: { user_id: req.user.id } });
    if (currentMembership?.group_id === group.id) {
      const groupWithMembers = await getGroupWithMembers(group.id);
      return res.status(200).json({ group: groupWithMembers });
    }

    await GroupMember.destroy({ where: { user_id: req.user.id } });
    await GroupMember.create({ user_id: req.user.id, group_id: group.id, role: "Member" });
    const groupWithMembers = await getGroupWithMembers(group.id);
    res.status(200).json({ group: groupWithMembers });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCurrentGroup,
  createGroup,
  updateCurrentGroup,
  joinGroup,
};
