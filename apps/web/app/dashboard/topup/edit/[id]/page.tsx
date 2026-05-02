 import TopUpForm from '../../TopUpForm'
 
interface Props {
  params: { id: string }
}
 
export default function EditTopUpPage({ params }: Props) {
  return <TopUpForm mode="edit" itemId={params.id} />
}
 