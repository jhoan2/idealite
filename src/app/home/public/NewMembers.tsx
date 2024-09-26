import { getNewMembers } from "~/server/farcaster";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";

export default async function NewMembers() {
    const members = await getNewMembers("dailylearning");

    return (
        <div className="flex justify-center relative w-full">
            {members.users.map((user: any, index: number) => (
                <Avatar
                    key={index}
                    className="w-10 h-10 border-2 border-white absolute"
                    style={{
                        left: `calc(30% + ${index * 30 - 30}px)`,
                        zIndex: 5 - index,
                    }}
                >
                    <AvatarImage src={user.pfp_url} />
                    <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>
            ))}
        </div>
    )
}
