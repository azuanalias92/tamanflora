import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'

interface CheckIn {
  id: string
  homestayId: string
  personInCharge: string
  submittedAt: string
}

export function RecentCheckins() {
  const { data } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: async () => {
      const res = await axios.get<{ data: CheckIn[] }>('/api/homestay-checkins?pageSize=5')
      return res.data.data
    },
  })

  const checkins = data || []

  if (checkins.length === 0) {
    return <div className='text-muted-foreground text-sm'>No recent check-ins found.</div>
  }

  return (
    <div className='space-y-8'>
      {checkins.map((checkin) => (
        <div key={checkin.id} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${checkin.personInCharge}`} alt='Avatar' />
            <AvatarFallback>{checkin.personInCharge.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{checkin.personInCharge}</p>
              <p className='text-muted-foreground text-sm'>
                Homestay {checkin.homestayId}
              </p>
            </div>
            <div className='text-muted-foreground text-sm'>
              {formatDistanceToNow(new Date(checkin.submittedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
