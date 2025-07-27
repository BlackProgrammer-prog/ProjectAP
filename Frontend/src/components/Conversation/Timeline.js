import { Stack, Typography, Divider } from "@mui/material";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { faIR } from 'date-fns/locale';


const Timeline = ({ date }) => {
    const formatDate = (date) => {
        if (isToday(date)) {
            return "Today";
        } else if (isYesterday(date)) {
            return "Yesterday";
        } else if (isThisYear(date)) {
            return format(date, "d MMMM", { locale: faIR });
        } else {
            return format(date, "d MMMM yyyy", { locale: faIR  });
        }
    };

    return (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%", my: 3 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography
                variant="caption"
                sx={{
                    color: "#65676B",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    px: 2,
                    backgroundColor: "background.paper",
                    borderRadius: 1,
                }}
            >
                {formatDate(date)}
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
        </Stack>
    );
};

export default Timeline; 